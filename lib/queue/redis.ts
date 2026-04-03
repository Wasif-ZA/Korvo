import IORedis from "ioredis";

export const queueConnection = new IORedis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
  family: Number(process.env.REDIS_FAMILY ?? 4),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});
