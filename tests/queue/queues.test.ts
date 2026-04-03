import { describe, it, expect, vi } from "vitest";

// Mock BullMQ Queue constructor to capture constructor args
// Must be a class mock since code uses `new Queue(name, opts)`
vi.mock("bullmq", () => {
  const MockQueue = vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    name: string,
    opts: Record<string, unknown>,
  ) {
    this.name = name;
    this.opts = opts;
  });
  return { Queue: MockQueue };
});

// Mock ioredis so Queue construction doesn't fail trying to connect
vi.mock("ioredis", () => {
  const MockIORedis = vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    config: Record<string, unknown>,
  ) {
    Object.assign(this, config);
  });
  return { default: MockIORedis };
});

import { QUEUE_NAMES } from "@/shared/queues";
import { Queue } from "bullmq";

// Import pipeline module after mocks are set — triggers Queue constructor call
const { pipelineQueue } = await import("@/lib/queue/pipeline");

describe("Queue names (ORCH-05)", () => {
  it("QUEUE_NAMES.PIPELINE is 'pipeline-queue'", () => {
    expect(QUEUE_NAMES.PIPELINE).toBe("pipeline-queue");
  });

  it("QUEUE_NAMES.GMAIL_SEND is 'gmail-send-queue'", () => {
    expect(QUEUE_NAMES.GMAIL_SEND).toBe("gmail-send-queue");
  });
});

describe("Pipeline queue config (ORCH-06)", () => {
  it("Queue constructor was called with pipeline-queue name and removeOnComplete config", () => {
    const mockQueue = Queue as unknown as ReturnType<typeof vi.fn>;
    expect(mockQueue).toHaveBeenCalledWith(
      "pipeline-queue",
      expect.objectContaining({
        defaultJobOptions: expect.objectContaining({
          removeOnComplete: { count: 100 },
        }),
      }),
    );
  });

  it("pipeline queue defaultJobOptions has removeOnComplete: { count: 100 }", () => {
    const mockQueue = Queue as unknown as ReturnType<typeof vi.fn>;
    const [, opts] = mockQueue.mock.calls[0] as [
      string,
      { defaultJobOptions: Record<string, unknown> },
    ];
    expect(opts.defaultJobOptions.removeOnComplete).toEqual({ count: 100 });
  });

  it("pipeline queue defaultJobOptions has removeOnFail: { count: 500 }", () => {
    const mockQueue = Queue as unknown as ReturnType<typeof vi.fn>;
    const [, opts] = mockQueue.mock.calls[0] as [
      string,
      { defaultJobOptions: Record<string, unknown> },
    ];
    expect(opts.defaultJobOptions.removeOnFail).toEqual({ count: 500 });
  });
});
