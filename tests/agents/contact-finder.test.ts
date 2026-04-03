/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so mockRunAgentLoop is available inside vi.mock factories
const { mockRunAgentLoop } = vi.hoisted(() => ({
  mockRunAgentLoop: vi.fn(),
}));

// Mock the agent-loop module — Contact Finder only depends on runAgentLoop
vi.mock("../../worker/lib/agent-loop", () => ({
  runAgentLoop: mockRunAgentLoop,
}));

// Import after mocks are set up
import {
  findContacts,
  CONTACT_FINDER_SYSTEM_PROMPT,
} from "../../worker/agents/contact-finder";

const THREE_CONTACTS_JSON = JSON.stringify([
  {
    name: "Alice Zhang",
    title: "Senior Software Engineer",
    source_url: "https://atlassian.com/team",
    confidence: "high",
    public_activity: "Active on GitHub, speaker at YOW 2024",
  },
  {
    name: "Ben Torres",
    title: "Engineering Manager",
    source_url: "https://atlassian.engineering/team",
    confidence: "medium",
    public_activity: null,
  },
  {
    name: "Carla Nguyen",
    title: "Software Engineer II",
    source_url: null,
    confidence: "low",
    public_activity: "Blog post on Atlassian tech blog",
  },
]);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("findContacts", () => {
  it("returns exactly 3 ContactResult objects when Claude returns 3 valid contacts", async () => {
    mockRunAgentLoop.mockResolvedValue(THREE_CONTACTS_JSON);

    const results = await findContacts(
      "Atlassian",
      "Software Engineer",
      "Sydney",
    );

    expect(results).toHaveLength(3);

    expect(results[0]).toMatchObject({
      name: "Alice Zhang",
      title: "Senior Software Engineer",
      sourceUrl: "https://atlassian.com/team",
      confidence: "high",
      publicActivity: "Active on GitHub, speaker at YOW 2024",
    });

    expect(results[1]).toMatchObject({
      name: "Ben Torres",
      title: "Engineering Manager",
      sourceUrl: "https://atlassian.engineering/team",
      confidence: "medium",
      publicActivity: null,
    });

    expect(results[2]).toMatchObject({
      name: "Carla Nguyen",
      title: "Software Engineer II",
      sourceUrl: null,
      confidence: "low",
      publicActivity: "Blog post on Atlassian tech blog",
    });
  });

  it("pads to exactly 3 results when Claude returns only 2 contacts", async () => {
    const twoContactsJson = JSON.stringify([
      {
        name: "Alice Zhang",
        title: "Senior Software Engineer",
        source_url: "https://atlassian.com/team",
        confidence: "high",
        public_activity: null,
      },
      {
        name: "Ben Torres",
        title: "Engineering Manager",
        source_url: null,
        confidence: "medium",
        public_activity: null,
      },
    ]);

    mockRunAgentLoop.mockResolvedValue(twoContactsJson);

    const results = await findContacts("Atlassian", "Software Engineer", null);

    expect(results).toHaveLength(3);
    // Third result should be the low-confidence placeholder
    expect(results[2]).toMatchObject({
      name: "Unknown Contact",
      title: "Unknown",
      sourceUrl: null,
      confidence: "low",
      publicActivity: null,
    });
  });

  it("returns 3 low-confidence placeholders when Claude returns malformed JSON", async () => {
    mockRunAgentLoop.mockResolvedValue("This is not valid JSON at all!!!");

    const results = await findContacts(
      "Atlassian",
      "Software Engineer",
      "Sydney",
    );

    expect(results).toHaveLength(3);
    for (const result of results) {
      expect(result.confidence).toBe("low");
      expect(result.name).toBe("Unknown Contact");
    }
  });

  it("returns 3 low-confidence placeholders when runAgentLoop throws", async () => {
    mockRunAgentLoop.mockRejectedValue(
      new Error("Agent loop exceeded 5 steps without completing"),
    );

    // Must never throw to caller
    const results = await findContacts("Atlassian", "Software Engineer", null);

    expect(results).toHaveLength(3);
    for (const result of results) {
      expect(result.confidence).toBe("low");
    }
  });

  it("maps snake_case LLM output to camelCase ContactResult correctly", async () => {
    const snakeCaseJson = JSON.stringify([
      {
        name: "Alice Zhang",
        title: "Senior Engineer",
        source_url: "https://example.com",
        confidence: "high",
        public_activity: "GitHub contributor",
      },
      {
        name: "Bob Smith",
        title: "Lead Engineer",
        source_url: null,
        confidence: "medium",
        public_activity: null,
      },
      {
        name: "Carol White",
        title: "Staff Engineer",
        source_url: "https://example.com/carol",
        confidence: "low",
        public_activity: "Conference speaker",
      },
    ]);

    mockRunAgentLoop.mockResolvedValue(snakeCaseJson);

    const results = await findContacts("ExampleCorp", "Engineer", "Melbourne");

    // Verify snake_case -> camelCase mapping
    expect(results[0].sourceUrl).toBe("https://example.com");
    expect(results[0].publicActivity).toBe("GitHub contributor");
    expect(results[1].sourceUrl).toBeNull();
    expect(results[1].publicActivity).toBeNull();
    expect(results[2].sourceUrl).toBe("https://example.com/carol");
  });

  it("ContactResult confidence values are string literals, not numbers", async () => {
    mockRunAgentLoop.mockResolvedValue(THREE_CONTACTS_JSON);

    const results = await findContacts("Atlassian", "Software Engineer", null);

    for (const result of results) {
      expect(["high", "medium", "low"]).toContain(result.confidence);
      expect(typeof result.confidence).toBe("string");
    }
  });

  it("handles JSON wrapped in markdown code fences", async () => {
    const wrappedJson = "```json\n" + THREE_CONTACTS_JSON + "\n```";
    mockRunAgentLoop.mockResolvedValue(wrappedJson);

    const results = await findContacts(
      "Atlassian",
      "Software Engineer",
      "Sydney",
    );

    expect(results).toHaveLength(3);
    expect(results[0].name).toBe("Alice Zhang");
  });

  it("system prompt contains LinkedIn prohibition", () => {
    expect(CONTACT_FINDER_SYSTEM_PROMPT).toContain("Never access linkedin.com");
  });

  it("passes correct parameters to runAgentLoop", async () => {
    mockRunAgentLoop.mockResolvedValue(THREE_CONTACTS_JSON);

    await findContacts("Atlassian", "Software Engineer", "Sydney");

    expect(mockRunAgentLoop).toHaveBeenCalledOnce();
    const callArgs = mockRunAgentLoop.mock.calls[0][0];

    expect(callArgs.systemPrompt).toBe(CONTACT_FINDER_SYSTEM_PROMPT);
    expect(callArgs.userMessage).toContain("Atlassian");
    expect(callArgs.userMessage).toContain("Software Engineer");
    expect(callArgs.userMessage).toContain("Sydney");
    expect(callArgs.maxSteps).toBe(5);
    expect(callArgs.maxTokens).toBe(2048);

    // Server tool should be web_search_20250305
    expect(callArgs.tools).toBeDefined();
    expect(callArgs.tools[0].name).toBe("web_search");
    expect(callArgs.tools[0].max_uses).toBe(5);
  });
});
