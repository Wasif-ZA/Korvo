import { describe, it, expect, vi } from "vitest";

// Mock ioredis — must be a class mock since code uses `new IORedis({...})`
// The constructor captures config properties on the instance
vi.mock("ioredis", () => {
  const MockIORedis = vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    config: Record<string, unknown>,
  ) {
    Object.assign(this, config);
  });
  return { default: MockIORedis };
});

import IORedis from "ioredis";

// Import after mock is set
const { queueConnection } = await import("@/lib/queue/redis");
const { workerConnection } = await import("@/worker/lib/redis");

describe("Next.js-side queue connection (lib/queue/redis.ts)", () => {
  it("queueConnection has maxRetriesPerRequest: 3", () => {
    const config = queueConnection as unknown as Record<string, unknown>;
    expect(config.maxRetriesPerRequest).toBe(3);
  });

  it("queueConnection has enableOfflineQueue: false", () => {
    const config = queueConnection as unknown as Record<string, unknown>;
    expect(config.enableOfflineQueue).toBe(false);
  });
});

describe("Worker-side Redis connections (worker/lib/redis.ts) (ORCH-03)", () => {
  it("workerConnection has maxRetriesPerRequest: null (critical for BRPOP)", () => {
    const config = workerConnection as unknown as Record<string, unknown>;
    expect(config.maxRetriesPerRequest).toBeNull();
  });

  it("workerConnection has enableReadyCheck: false", () => {
    const config = workerConnection as unknown as Record<string, unknown>;
    expect(config.enableReadyCheck).toBe(false);
  });

  it("IORedis constructor was called for both queue and worker connections", () => {
    const mockIORedis = IORedis as unknown as ReturnType<typeof vi.fn>;
    expect(mockIORedis.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
