/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Hoist mocks
const { mockGetUser, mockContactFindUniqueOrThrow, mockContactUpdate } =
  vi.hoisted(() => ({
    mockGetUser: vi.fn(),
    mockContactFindUniqueOrThrow: vi.fn(),
    mockContactUpdate: vi.fn(),
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
    contact: {
      findUniqueOrThrow: mockContactFindUniqueOrThrow,
      update: mockContactUpdate,
    },
  },
}));

const { PATCH } = await import("@/app/api/contacts/[id]/reminder/route");

function makeRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/contacts/${id}/reminder`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const MOCK_CONTACT = {
  id: "contact-1",
  name: "Sarah Chen",
  title: "Engineering Manager",
  notes: null,
  search: {
    id: "search-1",
    userId: "user-1",
    company: "Atlassian",
    role: "Software Engineer",
  },
};

describe("PATCH /api/contacts/[id]/reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContactUpdate.mockResolvedValue({ ...MOCK_CONTACT });
  });

  it("returns 401 when no auth token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = makeRequest("contact-1", { reminderActive: true });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "contact-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when body fails Zod validation (missing reminderActive)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const req = makeRequest("contact-1", { wrongField: true });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "contact-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid request");
  });

  it("returns 400 when reminderActive is not a boolean", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const req = makeRequest("contact-1", { reminderActive: "yes" });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "contact-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid request");
  });

  it("returns 404 when contact not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockContactFindUniqueOrThrow.mockRejectedValue(new Error("Not found"));

    const req = makeRequest("nonexistent-id", { reminderActive: true });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "nonexistent-id" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Contact not found");
  });

  it("returns 404 when contact not owned by user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "different-user" } },
      error: null,
    });
    mockContactFindUniqueOrThrow.mockResolvedValue(MOCK_CONTACT);

    const req = makeRequest("contact-1", { reminderActive: true });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "contact-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Contact not found");
  });

  it("returns 200 and sets reminder when reminderActive=true", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockContactFindUniqueOrThrow.mockResolvedValue(MOCK_CONTACT);

    const req = makeRequest("contact-1", { reminderActive: true });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "contact-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe("contact-1");
    expect(data.data.reminderAt).not.toBeNull();

    // Verify prisma.contact.update was called with a JSON string containing reminder_at
    expect(mockContactUpdate).toHaveBeenCalledOnce();
    const updateCall = mockContactUpdate.mock.calls[0][0];
    expect(updateCall.where.id).toBe("contact-1");
    const notes = JSON.parse(updateCall.data.notes as string) as {
      reminder_at: string;
    };
    expect(notes.reminder_at).toBeDefined();
    // Reminder should be approximately 7 days from now
    const reminderDate = new Date(notes.reminder_at);
    const now = new Date();
    const diffDays =
      (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThan(8);
  });

  it("returns 200 and clears reminder when reminderActive=false", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const contactWithReminder = {
      ...MOCK_CONTACT,
      notes: JSON.stringify({ reminder_at: new Date().toISOString() }),
    };
    mockContactFindUniqueOrThrow.mockResolvedValue(contactWithReminder);

    const req = makeRequest("contact-1", { reminderActive: false });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "contact-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.reminderAt).toBeNull();

    // Verify notes was set to null
    expect(mockContactUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notes: null }),
      }),
    );
  });
});
