/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock references so they are available inside vi.mock factories
const { mockRunAgentLoop, mockGetCompanyEnrichment } = vi.hoisted(() => ({
  mockRunAgentLoop: vi.fn(),
  mockGetCompanyEnrichment: vi.fn(),
}));

// Mock agent-loop
vi.mock("../../worker/lib/agent-loop", () => ({
  runAgentLoop: mockRunAgentLoop,
}));

// Mock firecrawl enrichment
vi.mock("../../worker/lib/firecrawl", () => ({
  getCompanyEnrichment: mockGetCompanyEnrichment,
}));

// Mock prisma (used transitively by firecrawl, but also needed to avoid import errors)
vi.mock("../../worker/lib/prisma", () => ({
  prisma: {
    companyEnrichment: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Import after mocks
import {
  researchContacts,
  RESEARCH_AGENT_SYSTEM_PROMPT,
} from "../../worker/agents/research-agent";
import type { ContactResult } from "../../shared/types/agents";

const SAMPLE_CONTACTS: ContactResult[] = [
  {
    name: "Alice Chen",
    title: "Senior Software Engineer",
    sourceUrl: "https://atlassian.com/team/alice",
    confidence: "high",
    publicActivity: "Spoke at TeamConf 2025",
  },
  {
    name: "Bob Smith",
    title: "Engineering Manager",
    sourceUrl: null,
    confidence: "medium",
    publicActivity: null,
  },
  {
    name: "Carol White",
    title: "Staff Engineer",
    sourceUrl: null,
    confidence: "low",
    publicActivity: null,
  },
];

const SAMPLE_ENRICHMENT = {
  techStack: ["React", "TypeScript", "AWS"],
  recentNews: ["Atlassian acquires Loom", "Team 2025 product launch"],
  companyValues: ["Open, honest, respectful"],
  hiringRoles: ["Senior Software Engineer", "Backend Engineer"],
  teamSize: "12000",
  scrapedPages: 8,
};

const SAMPLE_RESEARCH_RESPONSE = JSON.stringify({
  background:
    "Alice Chen is a Senior Software Engineer at Atlassian with 5+ years of experience in distributed systems.",
  ask_this:
    "I noticed you spoke at TeamConf 2025 — what insights did you share about distributed systems?",
  mention_this:
    "I saw Atlassian recently acquired Loom and was curious about how that's shaping the engineering culture.",
  hooks: [
    "spoke at TeamConf 2025",
    "team is hiring senior engineers",
    "Loom acquisition",
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCompanyEnrichment.mockResolvedValue(SAMPLE_ENRICHMENT);
  mockRunAgentLoop.mockResolvedValue(SAMPLE_RESEARCH_RESPONSE);
});

describe("researchContacts", () => {
  it("returns a ResearchCard for each contact", async () => {
    const cards = await researchContacts(
      SAMPLE_CONTACTS,
      "Atlassian",
      "atlassian.com",
    );

    expect(cards).toHaveLength(3);
    cards.forEach((card) => {
      expect(card).toHaveProperty("background");
      expect(card).toHaveProperty("askThis");
      expect(card).toHaveProperty("mentionThis");
      expect(card).toHaveProperty("hooks");
      expect(typeof card.background).toBe("string");
      expect(typeof card.askThis).toBe("string");
      expect(typeof card.mentionThis).toBe("string");
      expect(Array.isArray(card.hooks)).toBe(true);
    });
  });

  it("passes enrichment data in the user message sent to Claude", async () => {
    await researchContacts(SAMPLE_CONTACTS, "Atlassian", "atlassian.com");

    // runAgentLoop should have been called for each contact
    expect(mockRunAgentLoop).toHaveBeenCalledTimes(3);

    // Check that the user message contains enrichment context
    const firstCallArgs = mockRunAgentLoop.mock.calls[0][0];
    expect(firstCallArgs.userMessage).toContain("React");
    expect(firstCallArgs.userMessage).toContain("TypeScript");
    expect(firstCallArgs.userMessage).toContain("atlassian.com");
  });

  it("still works when getCompanyEnrichment returns null (Firecrawl failed)", async () => {
    mockGetCompanyEnrichment.mockResolvedValue(null);

    const cards = await researchContacts(
      SAMPLE_CONTACTS,
      "Atlassian",
      "atlassian.com",
    );

    expect(cards).toHaveLength(3);

    // User message should indicate no enrichment available
    const firstCallArgs = mockRunAgentLoop.mock.calls[0][0];
    expect(firstCallArgs.userMessage).toContain(
      "No company enrichment available",
    );
    expect(firstCallArgs.userMessage).toContain("web search");
  });

  it("returns fallback ResearchCard when runAgentLoop throws for a contact", async () => {
    mockRunAgentLoop
      .mockResolvedValueOnce(SAMPLE_RESEARCH_RESPONSE) // Alice succeeds
      .mockRejectedValueOnce(new Error("Claude API error")) // Bob fails
      .mockResolvedValueOnce(SAMPLE_RESEARCH_RESPONSE); // Carol succeeds

    const cards = await researchContacts(
      SAMPLE_CONTACTS,
      "Atlassian",
      "atlassian.com",
    );

    expect(cards).toHaveLength(3);

    // Bob's card should be the fallback
    const bobCard = cards[1];
    expect(bobCard.background).toContain("Bob Smith");
    expect(bobCard.background).toContain("Engineering Manager");
    expect(bobCard.hooks).toEqual([]);
  });

  it("calls getCompanyEnrichment exactly once (not per contact)", async () => {
    await researchContacts(SAMPLE_CONTACTS, "Atlassian", "atlassian.com");

    // Enrichment should be fetched only once regardless of contact count
    expect(mockGetCompanyEnrichment).toHaveBeenCalledOnce();
    expect(mockGetCompanyEnrichment).toHaveBeenCalledWith("atlassian.com");
  });

  it("system prompt contains 'Never access linkedin.com'", () => {
    expect(RESEARCH_AGENT_SYSTEM_PROMPT).toContain("Never access linkedin.com");
  });

  it("uses maxSteps: 3 per contact", async () => {
    await researchContacts([SAMPLE_CONTACTS[0]], "Atlassian", "atlassian.com");

    const callArgs = mockRunAgentLoop.mock.calls[0][0];
    expect(callArgs.maxSteps).toBe(3);
  });
});
