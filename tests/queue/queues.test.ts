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

// Mock BullMQ Queue constructor to capture constructor args
vi.mock("bullmq", () => {
  function MockQueue(
    this: { name: string; opts: Record<string, unknown> },
    name: string,
    opts: Record<string, unknown>,
  ) {
    MockQueue.calls.push([name, opts]);
    this.name = name;
    this.opts = opts;
  }
  MockQueue.calls = [] as Array<[string, Record<string, unknown>]>;

  return { Queue: MockQueue };
});

import { QUEUE_NAMES } from "@/shared/queues";

describe("QUEUE_NAMES constants (ORCH-05)", () => {
  it("QUEUE_NAMES.PIPELINE is 'pipeline-queue'", () => {
    expect(QUEUE_NAMES.PIPELINE).toBe("pipeline-queue");
  });

  it("QUEUE_NAMES.GMAIL_SEND is 'gmail-send-queue'", () => {
    expect(QUEUE_NAMES.GMAIL_SEND).toBe("gmail-send-queue");
  });
});

describe("pipelineQueue defaultJobOptions (ORCH-06)", () => {
  it("pipeline queue has removeOnComplete: { count: 100 }", async () => {
    const { Queue } = await import("bullmq");
    const MockQueue = Queue as unknown as {
      calls: Array<[string, Record<string, unknown>]>;
    };

    // Import pipelineQueue which triggers the Queue constructor call
    await import("@/lib/queue/pipeline");

    const pipelineCall = MockQueue.calls.find(
      (call) => call[0] === QUEUE_NAMES.PIPELINE,
    );
    expect(pipelineCall).toBeDefined();
    const opts = pipelineCall![1] as {
      defaultJobOptions?: {
        removeOnComplete?: unknown;
        removeOnFail?: unknown;
      };
    };
    expect(opts.defaultJobOptions?.removeOnComplete).toEqual({ count: 100 });
  });

  it("pipeline queue has removeOnFail: { count: 500 }", async () => {
    const { Queue } = await import("bullmq");
    const MockQueue = Queue as unknown as {
      calls: Array<[string, Record<string, unknown>]>;
    };

    const pipelineCall = MockQueue.calls.find(
      (call) => call[0] === QUEUE_NAMES.PIPELINE,
    );
    expect(pipelineCall).toBeDefined();
    const opts = pipelineCall![1] as {
      defaultJobOptions?: {
        removeOnComplete?: unknown;
        removeOnFail?: unknown;
      };
    };
    expect(opts.defaultJobOptions?.removeOnFail).toEqual({ count: 500 });
  });
});
