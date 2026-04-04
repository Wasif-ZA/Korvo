// lib/gmail/redis-client.ts
// Lightweight Redis client for API routes (Vercel serverless context).
// Worker context uses worker/lib/redis.ts (ioredis with host/port split).
// API routes use REDIS_URL for single-connection-string simplicity.
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, {
  family: Number(process.env.REDIS_FAMILY ?? 4),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});

export { redis as gmailRedis };
