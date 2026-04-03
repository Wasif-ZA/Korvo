/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock references so they can be referenced inside vi.mock factory functions
const {
  mockUpdate,
  mockCreateContact,
  mockUpdateContact,
  mockCreateOutreach,
  mockFindContacts,
  mockGuessEmails,
  mockResearchContacts,
  mockDraftEmails,
  mockBroadcast,
  mockExtractSignals,
  mockScoreContact,
} = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockCreateContact: vi.fn(),
  mockUpdateContact: vi.fn(),
  mockCreateOutreach: vi.fn(),
  mockFindContacts: vi.fn(),
  mockGuessEmails: vi.fn(),
  mockResearchContacts: vi.fn(),
  mockDraftEmails: vi.fn(),
  mockBroadcast: vi.fn(),
  mockExtractSignals: vi.fn(),
  mockScoreContact: vi.fn(),
}));

// Mock modules — must use vi.hoisted references inside factory functions
vi.mock("../../worker/lib/prisma", () => ({
  prisma: {
    search: { update: mockUpdate },
    contact: { create: mockCreateContact, update: mockUpdateContact },
    outreach: { create: mockCreateOutreach },
  },
}));

vi.mock("../../worker/lib/supabase", () => ({
  broadcastProgress: mockBroadcast,
}));

vi.mock("../../worker/lib/firecrawl", () => ({
  getCompanyEnrichment: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../worker/agents/contact-finder", () => ({
  findContacts: mockFindContacts,
}));

vi.mock("../../worker/agents/email-guesser", () => ({
  guessEmails: mockGuessEmails,
}));

vi.mock("../../worker/agents/research-agent", () => ({
  researchContacts: mockResearchContacts,
}));

vi.mock("../../worker/agents/email-drafter", () => ({
  draftEmails: mockDraftEmails,
}));

vi.mock("../../worker/scoring/scoring-engine", () => ({
  extractSignals: mockExtractSignals,
  scoreContact: mockScoreContact,
}));

// Import orchestrator and scoring module after mocks are registered
import { runPipeline } from "../../worker/orchestrator/pipeline";

const MOCK_JOB = {
  data: {
    searchId: "search_123",
    company: "Atlassian",
    role: "Engineer",
    location: "Sydney",
  },
  updateProgress: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const MOCK_CONTACTS = [
  {
    name: "John Doe",
    title: "Engineering Manager",
    sourceUrl: "https://atlassian.com/team",
    confidence: "high" as const,
    publicActivity: "blog at atlassian.com",
  },
];

const MOCK_GUESSES = [
  {
    email: "john@atlassian.com",
    confidence: "high" as const,
    patternSource: "found in author bio",
  },
];

const MOCK_RESEARCH = [
  {
    background: "John has been at Atlassian for 5 years",
    askThis: "What does the engineering career path look like?",
    mentionThis: "Saw your blog post on distributed systems",
    hooks: ["blog post on distributed systems", "team is hiring seniors"],
  },
];

const MOCK_DRAFTS = [
  {
    subject: "Quick question about engineering at Atlassian",
    body: "Hi John, I read your blog post on distributed systems.",
    templateType: "hiring_inquiry" as const,
    hookUsed: "blog post on distributed systems",
  },
];

const MOCK_SIGNALS = {
  titleMatchScore: 20,
  seniorityScore: 12,
  publicActivityScore: 15,
  emailConfidenceScore: 15,
  hiringSignalScore: 5,
};

const MOCK_SCORE = {
  total: 67,
  tone: "curious" as const,
  breakdown: MOCK_SIGNALS,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFindContacts.mockResolvedValue(MOCK_CONTACTS);
  mockGuessEmails.mockResolvedValue(MOCK_GUESSES);
  mockResearchContacts.mockResolvedValue(MOCK_RESEARCH);
  mockDraftEmails.mockResolvedValue(MOCK_DRAFTS);
  mockCreateContact.mockResolvedValue({ id: "contact_row_1" });
  mockUpdateContact.mockResolvedValue({});
  mockCreateOutreach.mockResolvedValue({});
  mockUpdate.mockResolvedValue({});
  // Restore scoring mocks after clearAllMocks (clearAllMocks resets implementations)
  mockExtractSignals.mockReturnValue(MOCK_SIGNALS);
  mockScoreContact.mockReturnValue(MOCK_SCORE);
});

describe("Pipeline Orchestrator Integration", () => {
  it("executes the full agent DAG in order and updates database", async () => {
    await runPipeline(MOCK_JOB);

    // Order: contacts -> parallel (emails + research) -> drafter
    expect(mockFindContacts).toHaveBeenCalledWith(
      "Atlassian",
      "Engineer",
      "Sydney",
    );
    expect(mockGuessEmails).toHaveBeenCalled();
    expect(mockResearchContacts).toHaveBeenCalled();
    expect(mockDraftEmails).toHaveBeenCalled();

    // DB writes
    expect(mockCreateContact).toHaveBeenCalledTimes(1);
    expect(mockUpdateContact).toHaveBeenCalledTimes(1);
    expect(mockCreateOutreach).toHaveBeenCalledTimes(1);

    // Final status update
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "search_123" },
        data: { status: "completed" },
      }),
    );
  });

  it("broadcasts all 4 progress stages", async () => {
    await runPipeline(MOCK_JOB);

    expect(mockBroadcast).toHaveBeenCalledWith("search_123", "contacts_found");
    expect(mockBroadcast).toHaveBeenCalledWith("search_123", "emails_guessed");
    expect(mockBroadcast).toHaveBeenCalledWith("search_123", "research_done");
    expect(mockBroadcast).toHaveBeenCalledWith("search_123", "drafts_ready");
  });

  it("sets status to failed if an agent throws", async () => {
    mockFindContacts.mockRejectedValue(new Error("Network fail"));

    await runPipeline(MOCK_JOB);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "failed" },
      }),
    );
  });

  it("overrides contact finder confidence with email guess confidence for scoring", async () => {
    // Contact finder says high, but email guess says low — scoring must use email guess confidence
    mockFindContacts.mockResolvedValue([
      { ...MOCK_CONTACTS[0], confidence: "high" as const },
    ]);
    mockGuessEmails.mockResolvedValue([
      { ...MOCK_GUESSES[0], confidence: "low" as const },
    ]);

    await runPipeline(MOCK_JOB);

    // extractSignals should have been called with confidence: "low" (email guess, not contact finder)
    expect(mockExtractSignals).toHaveBeenCalledTimes(1);
    const contactArgPassedToExtractSignals =
      mockExtractSignals.mock.calls[0][0];
    expect(contactArgPassedToExtractSignals.confidence).toBe("low");
  });

  it("writes contact rows with searchId and name after findContacts", async () => {
    await runPipeline(MOCK_JOB);

    expect(mockCreateContact).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          searchId: "search_123",
          name: "John Doe",
          title: "Engineering Manager",
        }),
      }),
    );
  });

  it("updates contact rows with email, score, and research after parallel step", async () => {
    await runPipeline(MOCK_JOB);

    expect(mockUpdateContact).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "contact_row_1" },
        data: expect.objectContaining({
          email: "john@atlassian.com",
          score: 67,
          researchBackground: "John has been at Atlassian for 5 years",
          researchMentionThis: "Saw your blog post on distributed systems",
        }),
      }),
    );
  });

  it("creates outreach rows with contactId and draft content after draftEmails", async () => {
    await runPipeline(MOCK_JOB);

    expect(mockCreateOutreach).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contactId: "contact_row_1",
          subject: "Quick question about engineering at Atlassian",
          templateType: "hiring_inquiry",
        }),
      }),
    );
  });
});
