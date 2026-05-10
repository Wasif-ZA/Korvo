import { describe, it, expect, vi } from "vitest";

// Mock worker/lib/redis.ts directly to avoid ioredis constructor issues
vi.mock("@/worker/lib/redis", () => ({
  queueConnection: {},
  workerConnection: {},
}));

// Mock dotenv/config for worker/index.ts
vi.mock("dotenv/config", () => ({}));

vi.mock("ioredis", () => {
  function MockIORedis(this: Record<string, unknown>) {
    this.get = vi.fn().mockResolvedValue(null);
    this.set = vi.fn().mockResolvedValue("OK");
    this.incr = vi.fn().mockResolvedValue(1);
    this.expire = vi.fn().mockResolvedValue(1);
    this.quit = vi.fn().mockResolvedValue("OK");
    this.disconnect = vi.fn();
  }

  return {
    default: MockIORedis,
  };
});

vi.mock("googleapis", () => ({
  google: {
    gmail: vi.fn(() => ({
      users: {
        messages: {
          send: vi.fn().mockResolvedValue({ data: { id: "gmail-message" } }),
        },
      },
    })),
  },
}));

vi.mock("@/lib/gmail/token-crypto", () => ({
  decryptToken: vi.fn(() => "refresh-token"),
}));

vi.mock("@/lib/gmail/oauth-client", () => ({
  getOAuth2Client: vi.fn(() => ({
    setCredentials: vi.fn(),
  })),
}));

vi.mock("@/lib/gmail/send-quota", () => ({
  checkAndIncrementDaily: vi.fn().mockResolvedValue({
    allowed: true,
    used: 1,
    limit: 5,
  }),
  markFirstSend: vi.fn().mockResolvedValue(undefined),
  recordBounce: vi.fn().mockResolvedValue(undefined),
  checkBounceRate: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    gmailToken: {
      findUnique: vi.fn().mockResolvedValue({
        encryptedRefreshToken: "encrypted",
      }),
      delete: vi.fn().mockResolvedValue({}),
    },
    outreach: {
      update: vi.fn().mockResolvedValue({}),
    },
    contact: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Mock the orchestrator so workers don't need real dependencies
vi.mock("@/worker/orchestrator/pipeline", () => ({
  runPipeline: vi.fn().mockResolvedValue(undefined),
}));

// BullMQ Worker mock is already registered in tests/setup.ts globally
// (Worker: vi.fn().mockImplementation(() => ({ on: vi.fn(), close: vi.fn() })))
// The setup.ts mock uses mockImplementation with arrow function — not a constructor.
// We override it here with a proper class-based mock.
vi.mock("bullmq", () => {
  function MockWorker(
    this: { on: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> },
    queueName: string,
    _processor: unknown,
    opts: { concurrency?: number },
  ) {
    MockWorker.calls.push([queueName, _processor, opts]);
    this.on = vi.fn().mockReturnThis();
    this.close = vi.fn().mockResolvedValue(undefined);
  }
  MockWorker.calls = [] as Array<[string, unknown, { concurrency?: number }]>;

  return {
    Worker: MockWorker,
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn().mockResolvedValue({ id: "test-job-id" }),
    })),
  };
});

import { QUEUE_NAMES } from "@/shared/queues";

describe("pipeline worker", () => {
  it("exports pipelineWorker", async () => {
    const { pipelineWorker } = await import("@/worker/pipeline.worker");
    expect(pipelineWorker).toBeDefined();
  });

  it("creates Worker with QUEUE_NAMES.PIPELINE and concurrency 5", async () => {
    const { Worker } = await import("bullmq");
    const MockWorker = Worker as unknown as {
      calls: Array<[string, unknown, { concurrency?: number }]>;
    };
    const pipelineCall = MockWorker.calls.find(
      (c) => c[0] === QUEUE_NAMES.PIPELINE,
    );
    expect(pipelineCall).toBeDefined();
    expect(pipelineCall![2]).toMatchObject({ concurrency: 5 });
  });
});

describe("gmail-send worker", () => {
  it("exports gmailSendWorker", async () => {
    const { gmailSendWorker } = await import("@/worker/gmail-send.worker");
    expect(gmailSendWorker).toBeDefined();
  });

  it("creates Worker with QUEUE_NAMES.GMAIL_SEND and concurrency 1", async () => {
    const { Worker } = await import("bullmq");
    const MockWorker = Worker as unknown as {
      calls: Array<[string, unknown, { concurrency?: number }]>;
    };
    const gmailCall = MockWorker.calls.find(
      (c) => c[0] === QUEUE_NAMES.GMAIL_SEND,
    );
    expect(gmailCall).toBeDefined();
    expect(gmailCall![2]).toMatchObject({ concurrency: 1 });
  });
});

describe("worker index (SIGTERM handler)", () => {
  it("registers a SIGTERM handler", async () => {
    const onSpy = vi.spyOn(process, "on");

    await import("@/worker/index");

    const sigtermCall = onSpy.mock.calls.find(([event]) => event === "SIGTERM");
    expect(sigtermCall).toBeDefined();

    onSpy.mockRestore();
  });
});
