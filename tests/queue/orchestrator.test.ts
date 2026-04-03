import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job } from "bullmq";
import type { PipelineJobData } from "@/shared/types/jobs";

// Mock worker/lib/supabase.ts
vi.mock("@/worker/lib/supabase", () => ({
  broadcastProgress: vi.fn().mockResolvedValue(undefined),
}));

// Mock worker/lib/prisma.ts
vi.mock("@/worker/lib/prisma", () => ({
  prisma: {
    search: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { broadcastProgress } from "@/worker/lib/supabase";
import { prisma } from "@/worker/lib/prisma";
import { runPipeline } from "@/worker/orchestrator/pipeline";

const mockBroadcastProgress = vi.mocked(broadcastProgress);
const mockPrismaSearchUpdate = vi.mocked(prisma.search.update);

function createFakeJob(data: PipelineJobData): Job<PipelineJobData> {
  return {
    id: "test-job-1",
    data,
    updateProgress: vi.fn().mockResolvedValue(undefined),
  } as unknown as Job<PipelineJobData>;
}

const fakeJobData: PipelineJobData = {
  searchId: "search-123",
  userId: "user-456",
  company: "Acme Corp",
  role: "Software Engineer",
  location: "Sydney",
};

describe("runPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sequences agent steps correctly — broadcasts 4 stages in order", async () => {
    const fakeJob = createFakeJob(fakeJobData);

    await runPipeline(fakeJob);

    expect(mockBroadcastProgress).toHaveBeenCalledTimes(4);

    const calls = mockBroadcastProgress.mock.calls;
    // First stage: contacts_found
    expect(calls[0][1]).toBe("contacts_found");
    // Middle stages: emails_guessed and research_done (parallel, either order)
    const middleStages = [calls[1][1], calls[2][1]];
    expect(middleStages).toContain("emails_guessed");
    expect(middleStages).toContain("research_done");
    // Last stage: drafts_ready
    expect(calls[3][1]).toBe("drafts_ready");
  });

  it("updates search status to processing at start and completed at end", async () => {
    const fakeJob = createFakeJob(fakeJobData);

    await runPipeline(fakeJob);

    const updateCalls = mockPrismaSearchUpdate.mock.calls;
    expect(updateCalls.length).toBeGreaterThanOrEqual(2);

    // First call: status processing
    expect(updateCalls[0][0]).toMatchObject({
      where: { id: "search-123" },
      data: { status: "processing" },
    });

    // Last call: status completed
    const lastCall = updateCalls[updateCalls.length - 1];
    expect(lastCall[0]).toMatchObject({
      where: { id: "search-123" },
      data: { status: "completed" },
    });
  });

  it("reports job progress at 25, 75, 100", async () => {
    const fakeJob = createFakeJob(fakeJobData);

    await runPipeline(fakeJob);

    const progressCalls = vi.mocked(fakeJob.updateProgress).mock.calls;
    expect(progressCalls[0][0]).toBe(25);
    expect(progressCalls[1][0]).toBe(75);
    expect(progressCalls[2][0]).toBe(100);
  });
});
