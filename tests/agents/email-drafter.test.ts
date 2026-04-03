/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock references so they are available inside vi.mock factory
const { mockRunAgentLoop } = vi.hoisted(() => ({
  mockRunAgentLoop: vi.fn(),
}));

// Mock the agent-loop module before any imports
vi.mock("../../worker/lib/agent-loop", () => ({
  runAgentLoop: mockRunAgentLoop,
}));

// Import after mocks are set up
import {
  draftEmails,
  buildDrafterSystemPrompt,
  validateTemplateType,
  generateFallbackDraft,
} from "../../worker/agents/email-drafter";
import type { DraftInput } from "../../worker/agents/email-drafter";
import type {
  ContactResult,
  ResearchCard,
  ScoreResult,
} from "../../shared/types/agents";

// ─── Shared fixtures ────────────────────────────────────────────────────────

const makeContact = (overrides?: Partial<ContactResult>): ContactResult => ({
  name: "Sarah Chen",
  title: "Engineering Manager",
  sourceUrl: "https://canva.com/team",
  confidence: "high",
  publicActivity: "Config 2025 speaker",
  ...overrides,
});

const makeResearch = (overrides?: Partial<ResearchCard>): ResearchCard => ({
  background: "Sarah leads the design systems team at Canva.",
  askThis: "How do you handle cross-platform token sync?",
  mentionThis: "I saw your talk at Config 2025.",
  hooks: ["Config 2025 speaker", "leads design systems"],
  ...overrides,
});

const makeScore = (overrides?: Partial<ScoreResult>): ScoreResult => ({
  total: 85,
  tone: "direct",
  breakdown: {
    titleMatchScore: 30,
    seniorityScore: 15,
    publicActivityScore: 20,
    emailConfidenceScore: 10,
    hiringSignalScore: 10,
  },
  ...overrides,
});

const SAMPLE_INPUT: DraftInput = {
  contact: makeContact(),
  research: makeResearch(),
  score: makeScore(),
  targetRole: "Junior Software Engineer",
  userName: "Alex",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── draftEmails ────────────────────────────────────────────────────────────

describe("draftEmails", () => {
  it("returns one DraftResult per input (3 inputs → 3 results)", async () => {
    const validJson = JSON.stringify({
      subject: "Quick question",
      body: "Sentence one. Sentence two. Sentence three. Sentence four.",
      template_type: "hiring_inquiry",
      hook_used: "Config 2025 talk",
    });

    mockRunAgentLoop.mockResolvedValue(validJson);

    const inputs: DraftInput[] = [
      SAMPLE_INPUT,
      { ...SAMPLE_INPUT, contact: makeContact({ name: "Bob Jones" }) },
      { ...SAMPLE_INPUT, contact: makeContact({ name: "Alice Lee" }) },
    ];

    const results = await draftEmails(inputs);

    expect(results).toHaveLength(3);
    expect(mockRunAgentLoop).toHaveBeenCalledTimes(3);
  });

  it("maps subject and body from agent response correctly", async () => {
    mockRunAgentLoop.mockResolvedValue(
      JSON.stringify({
        subject: "Config talk question",
        body: "S1. S2. S3. S4.",
        template_type: "hiring_inquiry",
        hook_used: "Config 2025 speaker",
      }),
    );

    const results = await draftEmails([SAMPLE_INPUT]);

    expect(results[0].subject).toBe("Config talk question");
    expect(results[0].body).toBe("S1. S2. S3. S4.");
    expect(results[0].templateType).toBe("hiring_inquiry");
    expect(results[0].hookUsed).toBe("Config 2025 speaker");
  });

  it("removes em dashes (U+2014) from body", async () => {
    mockRunAgentLoop.mockResolvedValue(
      JSON.stringify({
        subject: "Test",
        body: "Sentence one\u2014with em dash. S2. S3. S4.",
        template_type: "hiring_inquiry",
        hook_used: "test",
      }),
    );

    const results = await draftEmails([SAMPLE_INPUT]);

    expect(results[0].body).not.toContain("\u2014");
    expect(results[0].body).toContain(",");
  });

  it("removes double dashes from body", async () => {
    mockRunAgentLoop.mockResolvedValue(
      JSON.stringify({
        subject: "Test",
        body: "Here is -- a dash. S2. S3. S4.",
        template_type: "hiring_inquiry",
        hook_used: "test",
      }),
    );

    const results = await draftEmails([SAMPLE_INPUT]);

    expect(results[0].body).not.toContain("--");
  });

  it("returns fallback draft when runAgentLoop throws — never throws itself", async () => {
    mockRunAgentLoop.mockRejectedValue(new Error("API unavailable"));

    const results = await draftEmails([SAMPLE_INPUT]);

    expect(results).toHaveLength(1);
    expect(results[0].templateType).toBe("hiring_inquiry");
    expect(results[0].subject).toContain("Junior Software Engineer");
    expect(results[0].hookUsed).toBeTruthy();
  });

  it("returns results for all contacts even if some fail", async () => {
    mockRunAgentLoop
      .mockResolvedValueOnce(
        JSON.stringify({
          subject: "First",
          body: "S1. S2. S3. S4.",
          template_type: "referral_ask",
          hook_used: "hook",
        }),
      )
      .mockRejectedValueOnce(new Error("Failed for second contact"))
      .mockResolvedValueOnce(
        JSON.stringify({
          subject: "Third",
          body: "A. B. C. D.",
          template_type: "value_offer",
          hook_used: "hook2",
        }),
      );

    const inputs: DraftInput[] = [
      SAMPLE_INPUT,
      { ...SAMPLE_INPUT, contact: makeContact({ name: "Bob Jones" }) },
      { ...SAMPLE_INPUT, contact: makeContact({ name: "Alice Lee" }) },
    ];

    const results = await draftEmails(inputs);

    expect(results).toHaveLength(3);
    expect(results[0].templateType).toBe("referral_ask");
    expect(results[1].templateType).toBe("hiring_inquiry"); // fallback
    expect(results[2].templateType).toBe("value_offer");
  });

  it("uses maxSteps: 2 and empty tools array (drafter needs no tools)", async () => {
    mockRunAgentLoop.mockResolvedValue(
      JSON.stringify({
        subject: "Test",
        body: "One. Two. Three. Four.",
        template_type: "hiring_inquiry",
        hook_used: "test",
      }),
    );

    await draftEmails([SAMPLE_INPUT]);

    expect(mockRunAgentLoop).toHaveBeenCalledWith(
      expect.objectContaining({ maxSteps: 2, tools: [] }),
    );
  });

  it("validates templateType — 'followup_1' becomes 'hiring_inquiry'", async () => {
    mockRunAgentLoop.mockResolvedValue(
      JSON.stringify({
        subject: "Test",
        body: "One. Two. Three. Four.",
        template_type: "followup_1", // valid TemplateType but not a drafter output
        hook_used: "test",
      }),
    );

    const results = await draftEmails([SAMPLE_INPUT]);

    expect(results[0].templateType).toBe("hiring_inquiry");
  });

  it("templateType is one of the 3 valid drafter types", async () => {
    const validTypes = ["referral_ask", "hiring_inquiry", "value_offer"];

    mockRunAgentLoop.mockResolvedValue(
      JSON.stringify({
        subject: "Test",
        body: "One. Two. Three. Four.",
        template_type: "referral_ask",
        hook_used: "test",
      }),
    );

    const results = await draftEmails([SAMPLE_INPUT]);

    expect(validTypes).toContain(results[0].templateType);
  });
});

// ─── buildDrafterSystemPrompt ────────────────────────────────────────────────

describe("buildDrafterSystemPrompt", () => {
  it("'direct' prompt contains 'coffee chat' and 'shared connection'", () => {
    const prompt = buildDrafterSystemPrompt("direct");
    expect(prompt).toContain("coffee chat");
    expect(prompt).toContain("shared connection");
  });

  it("'curious' prompt contains 'open-ended question'", () => {
    const prompt = buildDrafterSystemPrompt("curious");
    expect(prompt).toContain("open-ended question");
  });

  it("'value_driven' prompt contains 'low-commitment'", () => {
    const prompt = buildDrafterSystemPrompt("value_driven");
    expect(prompt).toContain("low-commitment");
  });

  it("all prompts contain 'Exactly 4 sentences'", () => {
    for (const tone of ["direct", "curious", "value_driven"] as const) {
      expect(buildDrafterSystemPrompt(tone)).toContain("Exactly 4 sentences");
    }
  });

  it("all prompts contain 'Em dashes' in FORBIDDEN list", () => {
    for (const tone of ["direct", "curious", "value_driven"] as const) {
      expect(buildDrafterSystemPrompt(tone)).toContain("Em dashes");
    }
  });
});

// ─── validateTemplateType ────────────────────────────────────────────────────

describe("validateTemplateType", () => {
  it("passes through valid template types", () => {
    expect(validateTemplateType("referral_ask")).toBe("referral_ask");
    expect(validateTemplateType("hiring_inquiry")).toBe("hiring_inquiry");
    expect(validateTemplateType("value_offer")).toBe("value_offer");
  });

  it("returns 'hiring_inquiry' for invalid input", () => {
    expect(validateTemplateType("followup_1")).toBe("hiring_inquiry");
    expect(validateTemplateType("followup_2")).toBe("hiring_inquiry");
    expect(validateTemplateType(null)).toBe("hiring_inquiry");
    expect(validateTemplateType(undefined)).toBe("hiring_inquiry");
    expect(validateTemplateType(42)).toBe("hiring_inquiry");
    expect(validateTemplateType("invalid_value")).toBe("hiring_inquiry");
  });
});

// ─── generateFallbackDraft ───────────────────────────────────────────────────

describe("generateFallbackDraft", () => {
  it("never throws and returns a DraftResult", () => {
    const result = generateFallbackDraft(
      makeContact(),
      makeResearch(),
      makeScore(),
      "Junior SWE",
      "Alex",
    );

    expect(result).toHaveProperty("subject");
    expect(result).toHaveProperty("body");
    expect(result).toHaveProperty("templateType");
    expect(result).toHaveProperty("hookUsed");
    expect(result.templateType).toBe("hiring_inquiry");
  });

  it("uses research hooks as hookUsed", () => {
    const result = generateFallbackDraft(
      makeContact(),
      makeResearch({ hooks: ["specific hook"] }),
      makeScore(),
      "SWE",
      "Alex",
    );

    expect(result.hookUsed).toBe("specific hook");
  });

  it("falls back to mentionThis when hooks array is empty", () => {
    const result = generateFallbackDraft(
      makeContact(),
      makeResearch({ hooks: [], mentionThis: "your recent blog post" }),
      makeScore({ tone: "curious" }),
      "SWE",
      "Alex",
    );

    expect(result.hookUsed).toBe("your recent blog post");
  });

  it("body contains no em dashes", () => {
    const result = generateFallbackDraft(
      makeContact(),
      makeResearch(),
      makeScore(),
      "SWE",
      "Alex",
    );

    expect(result.body).not.toContain("\u2014");
  });
});
