import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockCheckAndIncrementSearchLimit = vi.fn();
const mockCheckGuestIpLimit = vi.fn();
const mockSearchCreate = vi.fn();
const mockSearchFindFirst = vi.fn();
const mockPipelineAdd = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
  ),
}));

vi.mock("@/lib/limits", () => ({
  checkAndIncrementSearchLimit: mockCheckAndIncrementSearchLimit,
  checkGuestIpLimit: mockCheckGuestIpLimit,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    search: {
      create: mockSearchCreate,
      findFirst: mockSearchFindFirst,
    },
  },
}));

vi.mock("@/lib/queue/pipeline", () => ({
  pipelineQueue: {
    add: mockPipelineAdd,
  },
}));

const { POST } = await import("@/app/api/search/route");

function makeRequest(body: unknown, forwardedFor?: string): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);
  return new NextRequest("http://localhost/api/search", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("/api/search POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchCreate.mockResolvedValue({ id: "search-123" });
    mockSearchFindFirst.mockResolvedValue(null);
    mockPipelineAdd.mockResolvedValue({ id: "mock-job-id" });
  });

  it("creates authenticated search and returns searchId and jobId", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "u@example.com" } },
      error: null,
    });
    mockCheckAndIncrementSearchLimit.mockResolvedValue({
      allowed: true,
      used: 1,
      limit: 5,
      plan: "free",
    });

    const req = makeRequest({ company: "Atlassian", role: "Engineer" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.limitReached).toBe(false);
    expect(data.searchId).toBe("search-123");
    expect(data.jobId).toBe("mock-job-id");
  });

  it("creates guest search and returns searchId without jobId", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockCheckGuestIpLimit.mockResolvedValue({
      allowed: true,
      used: 1,
      limit: 3,
      plan: "guest",
    });

    const req = makeRequest(
      {
        company: "Canva",
        role: "Product Designer",
        guestSessionId: "guest-abc",
      },
      "203.0.113.9",
    );
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.limitReached).toBe(false);
    expect(data.searchId).toBe("search-123");
    // Guest path does not enqueue in Phase 2
    expect(mockPipelineAdd).not.toHaveBeenCalled();
  });

  it("blocks concurrent search for authenticated user (D-08)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "u@example.com" } },
      error: null,
    });
    mockCheckAndIncrementSearchLimit.mockResolvedValue({
      allowed: true,
      used: 1,
      limit: 5,
      plan: "free",
    });
    // Simulate an active search already in progress
    mockSearchFindFirst.mockResolvedValue({
      id: "existing-search",
      status: "processing",
    });

    const req = makeRequest({ company: "Atlassian", role: "Engineer" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      limitReached: true,
      limitType: "concurrent",
      message: "A search is already in progress",
    });
    // Should not enqueue a new job
    expect(mockPipelineAdd).not.toHaveBeenCalled();
    // Should not create a new search row
    expect(mockSearchCreate).not.toHaveBeenCalled();
  });

  it("enqueues pipeline job for authenticated user with correct PipelineJobData (ORCH-04)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "u@example.com" } },
      error: null,
    });
    mockCheckAndIncrementSearchLimit.mockResolvedValue({
      allowed: true,
      used: 1,
      limit: 5,
      plan: "free",
    });
    mockSearchFindFirst.mockResolvedValue(null); // No active search

    const req = makeRequest({
      company: "Atlassian",
      role: "Engineer",
      location: "Sydney",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.limitReached).toBe(false);
    expect(data.searchId).toBe("search-123");
    expect(data.jobId).toBe("mock-job-id");
    expect(mockPipelineAdd).toHaveBeenCalledWith("pipeline", {
      searchId: "search-123",
      userId: "user-1",
      company: "Atlassian",
      role: "Engineer",
      location: "Sydney",
    });
  });
});
