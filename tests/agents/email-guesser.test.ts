/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so mockRunAgentLoop is available inside vi.mock factories
const { mockRunAgentLoop } = vi.hoisted(() => ({
  mockRunAgentLoop: vi.fn(),
}));

// Mock the agent-loop module
vi.mock("../../worker/lib/agent-loop", () => ({
  runAgentLoop: mockRunAgentLoop,
}));

// Import after mocks are set up
import {
  guessEmails,
  generateFallbackEmail,
  extractJsonObject,
  EMAIL_GUESSER_SYSTEM_PROMPT,
} from "../../worker/agents/email-guesser";
import type { ContactResult } from "../../shared/types/agents";

const makeContact = (overrides?: Partial<ContactResult>): ContactResult => ({
  name: "John Smith",
  title: "Senior Engineer",
  sourceUrl: "https://company.com/team",
  confidence: "high",
  publicActivity: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("guessEmails", () => {
  it("returns one EmailGuess per contact (3 contacts → 3 results)", async () => {
    const validJson = JSON.stringify({
      email: "john.smith@atlassian.com",
      confidence: "high",
      pattern_source: "found in blog author bio",
    });

    mockRunAgentLoop.mockResolvedValue(validJson);

    const contacts = [
      makeContact({ name: "John Smith" }),
      makeContact({ name: "Jane Doe", title: "Product Manager" }),
      makeContact({ name: "Bob Jones", title: "CTO" }),
    ];

    const results = await guessEmails(contacts, "atlassian.com");

    expect(results).toHaveLength(3);
    expect(mockRunAgentLoop).toHaveBeenCalledTimes(3);
  });

  it("returns high confidence when agent returns valid JSON with confidence high", async () => {
    mockRunAgentLoop.mockResolvedValue(
      JSON.stringify({
        email: "alice@stripe.com",
        confidence: "high",
        pattern_source: "found in blog author bio",
      }),
    );

    const results = await guessEmails(
      [makeContact({ name: "Alice Johnson" })],
      "stripe.com",
    );

    expect(results[0].confidence).toBe("high");
    expect(results[0].email).toBe("alice@stripe.com");
    expect(results[0].patternSource).toBe("found in blog author bio");
  });

  it("returns medium confidence for inferred pattern emails", async () => {
    mockRunAgentLoop.mockResolvedValue(
      JSON.stringify({
        email: "bob.jones@company.com",
        confidence: "medium",
        pattern_source: "inferred from company pattern",
      }),
    );

    const results = await guessEmails(
      [makeContact({ name: "Bob Jones" })],
      "company.com",
    );

    expect(results[0].confidence).toBe("medium");
    expect(results[0].patternSource).toBe("inferred from company pattern");
  });

  it("falls back to low-confidence guess when runAgentLoop throws", async () => {
    mockRunAgentLoop.mockRejectedValue(new Error("Agent loop exceeded steps"));

    const results = await guessEmails(
      [makeContact({ name: "Jane Doe" })],
      "example.com",
    );

    expect(results).toHaveLength(1);
    expect(results[0].confidence).toBe("low");
    expect(results[0].email).toBe("jane.doe@example.com");
    expect(results[0].patternSource).toContain("agent failed");
  });

  it("falls back gracefully when runAgentLoop returns invalid JSON", async () => {
    mockRunAgentLoop.mockResolvedValue("Sorry, I could not find an email.");

    const results = await guessEmails(
      [makeContact({ name: "Tom Brown" })],
      "acme.com",
    );

    expect(results).toHaveLength(1);
    expect(results[0].confidence).toBe("low");
    expect(results[0].email).toBe("tom.brown@acme.com");
  });

  it("uses maxSteps: 3 in runAgentLoop call (not default 5)", async () => {
    mockRunAgentLoop.mockResolvedValue(
      JSON.stringify({
        email: "test@company.com",
        confidence: "low",
        pattern_source: "guessed",
      }),
    );

    await guessEmails([makeContact()], "company.com");

    expect(mockRunAgentLoop).toHaveBeenCalledWith(
      expect.objectContaining({ maxSteps: 3 }),
    );
  });

  it("returns results for all contacts even if some fail", async () => {
    mockRunAgentLoop
      .mockResolvedValueOnce(
        JSON.stringify({
          email: "alice@company.com",
          confidence: "high",
          pattern_source: "found",
        }),
      )
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(
        JSON.stringify({
          email: "charlie@company.com",
          confidence: "medium",
          pattern_source: "inferred",
        }),
      );

    const contacts = [
      makeContact({ name: "Alice Smith" }),
      makeContact({ name: "Bob Jones" }),
      makeContact({ name: "Charlie Brown" }),
    ];

    const results = await guessEmails(contacts, "company.com");

    expect(results).toHaveLength(3);
    expect(results[0].confidence).toBe("high");
    expect(results[1].confidence).toBe("low"); // fallback for Bob
    expect(results[2].confidence).toBe("medium");
  });
});

describe("generateFallbackEmail", () => {
  it("returns first.last@domain for full name", () => {
    expect(generateFallbackEmail("John Smith", "atlassian.com")).toBe(
      "john.smith@atlassian.com",
    );
  });

  it("handles single-name case gracefully (no crash, returns first@domain)", () => {
    expect(generateFallbackEmail("Jane", "company.com")).toBe(
      "jane@company.com",
    );
  });

  it("lowercases the result", () => {
    expect(generateFallbackEmail("ALICE BOB", "TEST.COM")).toBe(
      "alice.bob@test.com",
    );
  });

  it("uses last word as last name for multi-part names", () => {
    expect(generateFallbackEmail("Mary Jane Watson", "marvel.com")).toBe(
      "mary.watson@marvel.com",
    );
  });

  it("handles empty-ish name gracefully", () => {
    const result = generateFallbackEmail("", "domain.com");
    expect(result).toContain("domain.com");
  });
});

describe("extractJsonObject", () => {
  it("extracts JSON from plain response", () => {
    const raw = '{"email": "a@b.com", "confidence": "high"}';
    const result = extractJsonObject(raw);
    expect(result.email).toBe("a@b.com");
  });

  it("extracts JSON from code fence response", () => {
    const raw = '```json\n{"email": "x@y.com", "confidence": "medium"}\n```';
    const result = extractJsonObject(raw);
    expect(result.email).toBe("x@y.com");
  });

  it("extracts JSON when surrounded by text", () => {
    const raw =
      'Here is the result: {"email": "z@w.com", "confidence": "low"} Done.';
    const result = extractJsonObject(raw);
    expect(result.email).toBe("z@w.com");
  });

  it("throws when no JSON object is present", () => {
    expect(() => extractJsonObject("No JSON here at all")).toThrow();
  });
});

describe("EMAIL_GUESSER_SYSTEM_PROMPT", () => {
  it("contains LinkedIn block instruction", () => {
    expect(EMAIL_GUESSER_SYSTEM_PROMPT).toContain("Never access linkedin.com");
  });

  it("instructs to return JSON only", () => {
    expect(EMAIL_GUESSER_SYSTEM_PROMPT).toContain("Return JSON only");
  });
});
