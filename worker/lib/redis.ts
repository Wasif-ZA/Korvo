import IORedis from "ioredis";

// Queue connection (for FlowProducer, Queue reads): fail fast
export const queueConnection = new IORedis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
  family: Number(process.env.REDIS_FAMILY ?? 4),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});

// Worker connection: MUST have maxRetriesPerRequest: null for BRPOP
// Per ORCH-03 and Pitfall 2 in RESEARCH.md
export const workerConnection = new IORedis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
  family: Number(process.env.REDIS_FAMILY ?? 4),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
