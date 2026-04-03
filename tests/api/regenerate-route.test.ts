/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Hoist mocks
const {
  mockGetUser,
  mockOutreachFindUniqueOrThrow,
  mockOutreachUpdate,
  mockAnthropicCreate,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockOutreachFindUniqueOrThrow: vi.fn(),
  mockOutreachUpdate: vi.fn(),
  mockAnthropicCreate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    }),
  ),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    outreach: {
      findUniqueOrThrow: mockOutreachFindUniqueOrThrow,
      update: mockOutreachUpdate,
    },
  },
}));

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: mockAnthropicCreate };
  }
  return { default: MockAnthropic };
});

const { POST } = await import("@/app/api/drafts/[id]/regenerate/route");

function makeRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/drafts/${id}/regenerate`, {
    method: "POST",
  });
}

const MOCK_OUTREACH = {
  id: "outreach-1",
  subject: "Old Subject",
  body: "Old body text",
  tone: "curious",
  contact: {
    id: "contact-1",
    name: "Sarah Chen",
    title: "Engineering Manager",
    score: 80,
    researchMentionThis: "Your talk on distributed systems",
    researchAskThis: "How do you scale teams?",
    search: {
      id: "search-1",
      userId: "user-1",
      company: "Atlassian",
      role: "Software Engineer",
    },
  },
};

const MOCK_AI_RESPONSE = {
  content: [
    {
      type: "text",
      text: JSON.stringify({
        subject: "Loved your distributed systems talk",
        body: "Hi Sarah, I came across your talk on distributed systems and was genuinely impressed by your approach to scaling teams. I am a software engineer looking to join Atlassian and would love to learn from your experience. Would you have 20 minutes for a quick chat?",
      }),
    },
  ],
};

describe("POST /api/drafts/[id]/regenerate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOutreachUpdate.mockResolvedValue({
      id: "outreach-1",
      subject: "Loved your distributed systems talk",
      body: "Hi Sarah, I came across your talk...",
      tone: "direct",
    });
    mockAnthropicCreate.mockResolvedValue(MOCK_AI_RESPONSE);
  });

  it("returns 401 when no auth token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = makeRequest("outreach-1");
    const res = await POST(req, {
      params: Promise.resolve({ id: "outreach-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when outreach not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockOutreachFindUniqueOrThrow.mockRejectedValue(new Error("Not found"));

    const req = makeRequest("nonexistent-id");
    const res = await POST(req, {
      params: Promise.resolve({ id: "nonexistent-id" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Draft not found");
  });

  it("returns 404 when outreach not owned by user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "different-user" } },
      error: null,
    });
    mockOutreachFindUniqueOrThrow.mockResolvedValue(MOCK_OUTREACH);

    const req = makeRequest("outreach-1");
    const res = await POST(req, {
      params: Promise.resolve({ id: "outreach-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Draft not found");
  });

  it("returns 200 with new subject and body on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockOutreachFindUniqueOrThrow.mockResolvedValue(MOCK_OUTREACH);

    const req = makeRequest("outreach-1");
    const res = await POST(req, {
      params: Promise.resolve({ id: "outreach-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("id");
    expect(data.data).toHaveProperty("subject");
    expect(data.data).toHaveProperty("body");
    expect(data.data).toHaveProperty("hook_used");
  });

  it("calls prisma.outreach.update with new draft content", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockOutreachFindUniqueOrThrow.mockResolvedValue(MOCK_OUTREACH);

    const req = makeRequest("outreach-1");
    await POST(req, { params: Promise.resolve({ id: "outreach-1" }) });

    expect(mockOutreachUpdate).toHaveBeenCalledOnce();
    const updateCall = mockOutreachUpdate.mock.calls[0][0];
    expect(updateCall.where.id).toBe("outreach-1");
    expect(updateCall.data).toHaveProperty("subject");
    expect(updateCall.data).toHaveProperty("body");
    expect(updateCall.data).toHaveProperty("tone");
  });

  it("derives tone as direct for score >= 75", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const highScoreOutreach = {
      ...MOCK_OUTREACH,
      contact: { ...MOCK_OUTREACH.contact, score: 80 },
    };
    mockOutreachFindUniqueOrThrow.mockResolvedValue(highScoreOutreach);

    const req = makeRequest("outreach-1");
    await POST(req, { params: Promise.resolve({ id: "outreach-1" }) });

    expect(mockOutreachUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tone: "direct" }),
      }),
    );
  });
});
