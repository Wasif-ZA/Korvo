/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock
const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    search: { findUniqueOrThrow: mockFindUnique },
  },
}));

import { assemblePipelineResponse } from "@/lib/api/pipeline-response";

const MOCK_SEARCH_DB = {
  company: "Atlassian",
  role: "Engineer",
  status: "completed",
  contacts: [
    {
      name: "Sarah Chen",
      title: "EM",
      email: "sarah@atlassian.com",
      emailConfidence: "high",
      researchMentionThis: "I saw your talk",
      researchAskThis: "How do you scale?",
      outreach: [
        {
          subject: "Draft sub",
          body: "Draft body",
          createdAt: new Date(),
        },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("assemblePipelineResponse", () => {
  it("assembles a full PipelineResponse from DB rows", async () => {
    mockFindUnique.mockResolvedValue(MOCK_SEARCH_DB);

    const res = await assemblePipelineResponse("search_123");

    expect(res.company).toBe("Atlassian");
    expect(res.pipeline_status).toBe("complete");
    expect(res.contacts).toHaveLength(1);
    expect(res.contacts[0].name).toBe("Sarah Chen");
    expect(res.contacts[0].confidence).toBe(0.9); // high
    expect(res.contacts[0].hooks).toContain("I saw your talk");

    expect(res.drafts).toHaveLength(1);
    expect(res.drafts[0].subject).toBe("Draft sub");
    expect(res.steps).toHaveLength(4);
    expect(res.steps.every((s) => s.status === "complete")).toBe(true);
  });

  it("maps confidence strings to numeric values correctly", async () => {
    const mockData = {
      ...MOCK_SEARCH_DB,
      contacts: [
        { ...MOCK_SEARCH_DB.contacts[0], emailConfidence: "high" },
        { ...MOCK_SEARCH_DB.contacts[0], emailConfidence: "medium" },
        { ...MOCK_SEARCH_DB.contacts[0], emailConfidence: "low" },
      ],
    };
    mockFindUnique.mockResolvedValue(mockData);

    const res = await assemblePipelineResponse("search_123");
    expect(res.contacts[0].confidence).toBe(0.9);
    expect(res.contacts[1].confidence).toBe(0.6);
    expect(res.contacts[2].confidence).toBe(0.3);
  });

  it("handles running status by returning simplified steps", async () => {
    mockFindUnique.mockResolvedValue({
      ...MOCK_SEARCH_DB,
      status: "processing",
    });

    const res = await assemblePipelineResponse("search_123");
    expect(res.pipeline_status).toBe("running");
    expect(res.steps[0].status).toBe("running");
    expect(res.steps[1].status).toBe("pending");
  });

  it("handles failed status by marking steps as failed", async () => {
    mockFindUnique.mockResolvedValue({ ...MOCK_SEARCH_DB, status: "failed" });

    const res = await assemblePipelineResponse("search_123");
    expect(res.pipeline_status).toBe("failed");
    expect(res.steps.every((s) => s.status === "failed")).toBe(true);
  });

  it("drafts array uses researchMentionThis as hook_used", async () => {
    mockFindUnique.mockResolvedValue(MOCK_SEARCH_DB);

    const res = await assemblePipelineResponse("search_123");
    expect(res.drafts[0].hook_used).toBe("I saw your talk");
    expect(res.drafts[0].contact_name).toBe("Sarah Chen");
  });
});
