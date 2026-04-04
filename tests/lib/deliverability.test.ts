// tests/lib/deliverability.test.ts
// Tests for lib/gmail/send-quota.ts
// Uses an in-memory Redis mock for fast, isolated testing.
// Covers: warm-up ramp, daily limits, bounce tracking, jitter range.
import { describe, it, expect, beforeEach } from "vitest";
import {
  getDailyKey,
  getDailyLimit,
  checkAndIncrementDaily,
  recordBounce,
  checkBounceRate,
  getJitterMs,
  markFirstSend,
} from "../../lib/gmail/send-quota";

// ─── In-memory Redis mock ────────────────────────────────────────────────────

type MockStore = Map<string, string | number>;
type MockZSetStore = Map<string, Map<string, number>>;

function createRedisMock() {
  const store: MockStore = new Map();
  const zsets: MockZSetStore = new Map();

  return {
    store,
    zsets,

    async get(key: string): Promise<string | null> {
      const val = store.get(key);
      if (val === undefined) return null;
      return String(val);
    },

    async incr(key: string): Promise<number> {
      const current = Number(store.get(key) ?? 0);
      const next = current + 1;
      store.set(key, next);
      return next;
    },

    async expire(_key: string, _seconds: number): Promise<number> {
      // No-op in tests — TTL not needed for in-memory store
      return 1;
    },

    async zadd(key: string, score: number, member: string): Promise<number> {
      if (!zsets.has(key)) {
        zsets.set(key, new Map());
      }
      const zset = zsets.get(key)!;
      const isNew = !zset.has(member);
      zset.set(member, score);
      return isNew ? 1 : 0;
    },

    async zrangebyscore(
      key: string,
      min: number | string,
      max: number | string,
    ): Promise<string[]> {
      const zset = zsets.get(key);
      if (!zset) return [];
      const minNum = min === "-inf" ? -Infinity : Number(min);
      const maxNum = max === "+inf" ? Infinity : Number(max);
      const results: string[] = [];
      for (const [member, score] of zset.entries()) {
        if (score >= minNum && score <= maxNum) {
          results.push(member);
        }
      }
      return results;
    },

    async setnx(key: string, value: string): Promise<number> {
      if (store.has(key)) return 0;
      store.set(key, value);
      return 1;
    },

    async set(key: string, value: string): Promise<string> {
      store.set(key, value);
      return "OK";
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TEST_USER = "user-test-abc123";

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// ─── getDailyKey ─────────────────────────────────────────────────────────────

describe("getDailyKey", () => {
  it("returns key with today UTC date in YYYY-MM-DD format", () => {
    const key = getDailyKey(TEST_USER);
    const todayUTC = new Date().toISOString().split("T")[0];
    expect(key).toBe(`gmail:daily:${TEST_USER}:${todayUTC}`);
  });
});

// ─── getDailyLimit ───────────────────────────────────────────────────────────

describe("getDailyLimit", () => {
  it("returns 5 when firstSentAt is null (never sent)", async () => {
    const redis = createRedisMock();
    const limit = await getDailyLimit(TEST_USER, redis);
    expect(limit).toBe(5);
  });

  it("returns 5 when firstSentAt is 3 days ago (Day 1-7 window)", async () => {
    const redis = createRedisMock();
    redis.store.set(`gmail:warmup:${TEST_USER}:first_sent_at`, daysAgo(3));
    const limit = await getDailyLimit(TEST_USER, redis);
    expect(limit).toBe(5);
  });

  it("returns 5 when firstSentAt is 6 days ago (still in Day 1-7)", async () => {
    const redis = createRedisMock();
    redis.store.set(`gmail:warmup:${TEST_USER}:first_sent_at`, daysAgo(6));
    const limit = await getDailyLimit(TEST_USER, redis);
    expect(limit).toBe(5);
  });

  it("returns 10 when firstSentAt is 10 days ago (Day 8-14 window)", async () => {
    const redis = createRedisMock();
    redis.store.set(`gmail:warmup:${TEST_USER}:first_sent_at`, daysAgo(10));
    const limit = await getDailyLimit(TEST_USER, redis);
    expect(limit).toBe(10);
  });

  it("returns 10 when firstSentAt is 13 days ago (still in Day 8-14)", async () => {
    const redis = createRedisMock();
    redis.store.set(`gmail:warmup:${TEST_USER}:first_sent_at`, daysAgo(13));
    const limit = await getDailyLimit(TEST_USER, redis);
    expect(limit).toBe(10);
  });

  it("returns 20 when firstSentAt is 20 days ago (Day 15+ window)", async () => {
    const redis = createRedisMock();
    redis.store.set(`gmail:warmup:${TEST_USER}:first_sent_at`, daysAgo(20));
    const limit = await getDailyLimit(TEST_USER, redis);
    expect(limit).toBe(20);
  });

  it("returns 20 when firstSentAt is 100 days ago", async () => {
    const redis = createRedisMock();
    redis.store.set(`gmail:warmup:${TEST_USER}:first_sent_at`, daysAgo(100));
    const limit = await getDailyLimit(TEST_USER, redis);
    expect(limit).toBe(20);
  });
});

// ─── checkAndIncrementDaily ──────────────────────────────────────────────────

describe("checkAndIncrementDaily", () => {
  it("first call returns allowed=true, used=1, limit=5", async () => {
    const redis = createRedisMock();
    const result = await checkAndIncrementDaily(TEST_USER, redis);
    expect(result).toEqual({ allowed: true, used: 1, limit: 5 });
  });

  it("5th call returns allowed=true, used=5, limit=5", async () => {
    const redis = createRedisMock();
    let result;
    for (let i = 0; i < 5; i++) {
      result = await checkAndIncrementDaily(TEST_USER, redis);
    }
    expect(result).toEqual({ allowed: true, used: 5, limit: 5 });
  });

  it("6th call returns allowed=false, used=5, limit=5 (limit reached)", async () => {
    const redis = createRedisMock();
    for (let i = 0; i < 5; i++) {
      await checkAndIncrementDaily(TEST_USER, redis);
    }
    const result = await checkAndIncrementDaily(TEST_USER, redis);
    expect(result).toEqual({ allowed: false, used: 5, limit: 5 });
  });

  it("allows 10/day for user 10 days into warm-up", async () => {
    const redis = createRedisMock();
    redis.store.set(`gmail:warmup:${TEST_USER}:first_sent_at`, daysAgo(10));

    for (let i = 0; i < 10; i++) {
      const r = await checkAndIncrementDaily(TEST_USER, redis);
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkAndIncrementDaily(TEST_USER, redis);
    expect(blocked.allowed).toBe(false);
    expect(blocked.limit).toBe(10);
  });
});

// ─── recordBounce + checkBounceRate ──────────────────────────────────────────

describe("recordBounce + checkBounceRate", () => {
  it("no bounces, no sends: returns not suspended, rate 0", async () => {
    const redis = createRedisMock();
    const result = await checkBounceRate(TEST_USER, redis);
    expect(result.suspended).toBe(false);
    expect(result.rate).toBe(0);
  });

  it("10 sends, 0 bounces: not suspended", async () => {
    const redis = createRedisMock();
    // Simulate 10 sends in daily counter
    redis.store.set(getDailyKey(TEST_USER), 10);

    const result = await checkBounceRate(TEST_USER, redis);
    expect(result.suspended).toBe(false);
    expect(result.rate).toBe(0);
  });

  it("10 sends, 1 bounce: rate=0.10 > 0.05 — suspended", async () => {
    const redis = createRedisMock();
    redis.store.set(getDailyKey(TEST_USER), 10);

    await recordBounce(TEST_USER, "bounce@example.com", redis);

    const result = await checkBounceRate(TEST_USER, redis);
    expect(result.suspended).toBe(true);
    expect(result.rate).toBeCloseTo(0.1);
  });

  it("100 sends, 4 bounces: rate=0.04 <= 0.05 — not suspended", async () => {
    const redis = createRedisMock();
    redis.store.set(getDailyKey(TEST_USER), 100);

    for (let i = 0; i < 4; i++) {
      await recordBounce(TEST_USER, `bounce${i}@example.com`, redis);
    }

    const result = await checkBounceRate(TEST_USER, redis);
    expect(result.suspended).toBe(false);
    expect(result.rate).toBeCloseTo(0.04);
  });

  it("100 sends, 6 bounces: rate=0.06 > 0.05 — suspended", async () => {
    const redis = createRedisMock();
    redis.store.set(getDailyKey(TEST_USER), 100);

    for (let i = 0; i < 6; i++) {
      await recordBounce(TEST_USER, `bounce${i}@example.com`, redis);
    }

    const result = await checkBounceRate(TEST_USER, redis);
    expect(result.suspended).toBe(true);
  });

  it("recordBounce uses zadd to gmail:bounces:{userId}", async () => {
    const redis = createRedisMock();
    await recordBounce(TEST_USER, "test@example.com", redis);
    expect(redis.zsets.has(`gmail:bounces:${TEST_USER}`)).toBe(true);
  });
});

// ─── getJitterMs ─────────────────────────────────────────────────────────────

describe("getJitterMs", () => {
  it("returns value between 60000ms and 180000ms", () => {
    for (let i = 0; i < 100; i++) {
      const jitter = getJitterMs();
      expect(jitter).toBeGreaterThanOrEqual(60000);
      expect(jitter).toBeLessThanOrEqual(180000);
    }
  });

  it("returns a number (not NaN)", () => {
    const jitter = getJitterMs();
    expect(typeof jitter).toBe("number");
    expect(isNaN(jitter)).toBe(false);
  });
});

// ─── markFirstSend ───────────────────────────────────────────────────────────

describe("markFirstSend", () => {
  it("sets first_sent_at key on first call", async () => {
    const redis = createRedisMock();
    await markFirstSend(TEST_USER, redis);
    const val = await redis.get(`gmail:warmup:${TEST_USER}:first_sent_at`);
    expect(val).toBeTruthy();
    expect(new Date(val!).getTime()).toBeGreaterThan(0);
  });

  it("does not overwrite on second call (SETNX semantics)", async () => {
    const redis = createRedisMock();
    const first = daysAgo(5);
    redis.store.set(`gmail:warmup:${TEST_USER}:first_sent_at`, first);

    await markFirstSend(TEST_USER, redis);

    const val = await redis.get(`gmail:warmup:${TEST_USER}:first_sent_at`);
    expect(val).toBe(first);
  });
});
