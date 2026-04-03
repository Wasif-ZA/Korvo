import { describe, it, expect, vi } from "vitest";

// Mock ioredis using a regular function (not arrow) so it can be called as constructor
// Per decision: arrow functions cannot be called with new
vi.mock("ioredis", () => {
  function MockIORedis(
    this: Record<string, unknown>,
    config: Record<string, unknown>,
  ) {
    Object.assign(this, config);
  }
  return { default: MockIORedis };
});

describe("Next.js queueConnection (lib/queue/redis.ts)", () => {
  it("has maxRetriesPerRequest: 3", async () => {
    const { queueConnection } = await import("@/lib/queue/redis");
    const config = queueConnection as unknown as Record<string, unknown>;
    expect(config.maxRetriesPerRequest).toBe(3);
  });

  it("has enableOfflineQueue: false", async () => {
    const { queueConnection } = await import("@/lib/queue/redis");
    const config = queueConnection as unknown as Record<string, unknown>;
    expect(config.enableOfflineQueue).toBe(false);
  });
});

describe("Worker workerConnection (worker/lib/redis.ts) (ORCH-03)", () => {
  it("has maxRetriesPerRequest: null", async () => {
    const { workerConnection } = await import("@/worker/lib/redis");
    const config = workerConnection as unknown as Record<string, unknown>;
    expect(config.maxRetriesPerRequest).toBeNull();
  });

  it("has enableReadyCheck: false", async () => {
    const { workerConnection } = await import("@/worker/lib/redis");
    const config = workerConnection as unknown as Record<string, unknown>;
    expect(config.enableReadyCheck).toBe(false);
  });
});
