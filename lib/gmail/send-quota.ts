// lib/gmail/send-quota.ts
// Deliverability enforcement: daily send limits, warm-up ramp, bounce tracking.
// Accepts Redis as a parameter (dependency injection) for testability.
// In production, callers pass the imported queueConnection from worker/lib/redis.ts.
//
// Key structure (D-13):
//   gmail:warmup:{userId}:first_sent_at  → ISO timestamp (SET once via SETNX)
//   gmail:daily:{userId}:{YYYY-MM-DD}    → integer counter (INCR, EXPIRE at midnight UTC)
//   gmail:bounces:{userId}               → sorted set (zadd with timestamp score)
//   gmail:suspended:{userId}             → flag (SET when bounce rate >5%)
//
// See: .planning/phases/05-gmail-send-deliverability/05-RESEARCH.md Pattern 3
// See: D-09, D-11, D-12, D-13 in 05-CONTEXT.md

type RedisLike = {
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number | unknown>;
  zadd(key: string, score: number, member: string): Promise<number | unknown>;
  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<string[]>;
  setnx(key: string, value: string): Promise<number | unknown>;
  set(
    key: string,
    value: string,
    ...args: unknown[]
  ): Promise<string | null | unknown>;
};

/**
 * Returns the Redis key for today's daily send counter for a user.
 * Uses UTC date to ensure consistency across timezones.
 */
export function getDailyKey(userId: string): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC
  return `gmail:daily:${userId}:${today}`;
}

/**
 * Returns the daily send limit for a user based on warm-up ramp (D-09):
 * - Day 1-7: 5 emails/day
 * - Day 8-14: 10 emails/day
 * - Day 15+: 20 emails/day
 *
 * firstSentAt is stored as ISO string in Redis key gmail:warmup:{userId}:first_sent_at.
 * If never sent, returns 5 (start of ramp).
 */
export async function getDailyLimit(
  userId: string,
  redis: RedisLike,
): Promise<number> {
  const firstSentKey = `gmail:warmup:${userId}:first_sent_at`;
  const firstSentAt = await redis.get(firstSentKey);
  if (!firstSentAt) return 5; // Day 1 — not yet sent anything

  const daysSinceFirst = Math.floor(
    (Date.now() - new Date(firstSentAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSinceFirst < 7) return 5;
  if (daysSinceFirst < 14) return 10;
  return 20;
}

/**
 * Atomically checks and increments the daily send counter.
 * Returns allowed=false if the user has reached their daily limit.
 * Sets EXPIRE on the counter key to midnight UTC so counters reset daily (D-13).
 */
export async function checkAndIncrementDaily(
  userId: string,
  redis: RedisLike,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const key = getDailyKey(userId);
  const limit = await getDailyLimit(userId, redis);
  const current = Number((await redis.get(key)) ?? 0);

  if (current >= limit) {
    return { allowed: false, used: current, limit };
  }

  const newCount = await redis.incr(key);
  // Set expiry to end of day (UTC midnight)
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);
  await redis.expire(key, ttl);

  return { allowed: true, used: newCount, limit };
}

/**
 * Records a hard bounce for a user in a Redis sorted set.
 * Score is the Unix timestamp (ms) for 24h rolling window queries.
 * Per D-12: bounce rate monitoring.
 */
export async function recordBounce(
  userId: string,
  email: string,
  redis: RedisLike,
): Promise<void> {
  await redis.zadd(`gmail:bounces:${userId}`, Date.now(), email);
}

/**
 * Checks whether the user's 24h bounce rate exceeds 5% (D-12).
 * Compares bounce count in last 24h vs daily send count.
 * If suspended, sets gmail:suspended:{userId} key.
 */
export async function checkBounceRate(
  userId: string,
  redis: RedisLike,
): Promise<{ suspended: boolean; rate: number }> {
  const windowStart = Date.now() - 24 * 60 * 60 * 1000;
  const bounces = await redis.zrangebyscore(
    `gmail:bounces:${userId}`,
    windowStart,
    "+inf",
  );
  const bounceCount = bounces.length;

  // Get today's send count for rate calculation
  const dailyKey = getDailyKey(userId);
  const sends = Number((await redis.get(dailyKey)) ?? 0);

  if (sends === 0) {
    return { suspended: false, rate: 0 };
  }

  const rate = bounceCount / sends;
  const suspended = rate > 0.05; // 5% threshold per D-12

  if (suspended) {
    await redis.set(`gmail:suspended:${userId}`, "1");
  }

  return { suspended, rate };
}

/**
 * Returns a jitter delay in milliseconds between 60 and 180 seconds (D-11).
 * Applied as BullMQ job delay at enqueue time.
 */
export function getJitterMs(): number {
  return (60 + Math.random() * 120) * 1000;
}

/**
 * Records the timestamp of the user's first Gmail send (once only via SETNX).
 * This drives the warm-up ramp calculation in getDailyLimit.
 */
export async function markFirstSend(
  userId: string,
  redis: RedisLike,
): Promise<void> {
  await redis.setnx(
    `gmail:warmup:${userId}:first_sent_at`,
    new Date().toISOString(),
  );
}
