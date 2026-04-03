/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so mockCreate is available inside vi.mock factories (hoisted to top)
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

// Mock p-retry to call the function directly (skip actual retry delays in tests)
vi.mock("p-retry", () => ({
  default: (fn: () => Promise<unknown>) => fn(),
}));

// Mock worker/lib/claude-client to avoid ANTHROPIC_API_KEY env check at module load
// and to wire mockCreate into the agent-loop
vi.mock("../../worker/lib/claude-client", () => ({
  claude: {
    messages: {
      create: mockCreate,
    },
  },
  HAIKU_MODEL: "claude-haiku-4-5-20251001",
}));

// Import after mocks are set up
import { runAgentLoop } from "../../worker/lib/agent-loop";

const DUMMY_TOOLS = [
  {
    name: "web_search",
    description: "Search the web",
    input_schema: {
      type: "object" as const,
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

const BASE_OPTIONS = {
  systemPrompt: "You are a helpful assistant.",
  userMessage: "Find contacts at Acme Corp",
  tools: DUMMY_TOOLS,
  executeTool: vi.fn().mockResolvedValue("tool result"),
};

beforeEach(() => {
  vi.clearAllMocks();
  BASE_OPTIONS.executeTool = vi.fn().mockResolvedValue("tool result");
});

describe("runAgentLoop", () => {
  it("returns text content when stop_reason is end_turn", async () => {
    mockCreate.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "Found 3 contacts: Alice, Bob, Carol" }],
    });

    const result = await runAgentLoop(BASE_OPTIONS);
    expect(result).toBe("Found 3 contacts: Alice, Bob, Carol");
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("calls executeTool on tool_use then returns final text on end_turn", async () => {
    mockCreate
      .mockResolvedValueOnce({
        stop_reason: "tool_use",
        content: [
          {
            type: "tool_use",
            id: "tool_abc",
            name: "web_search",
            input: { query: "Acme Corp team" },
          },
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: "end_turn",
        content: [{ type: "text", text: "Final answer after tool use" }],
      });

    const result = await runAgentLoop(BASE_OPTIONS);

    expect(BASE_OPTIONS.executeTool).toHaveBeenCalledWith("web_search", {
      query: "Acme Corp team",
    });
    expect(result).toBe("Final answer after tool use");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("filters LinkedIn URLs from tool results before sending back to Claude", async () => {
    const executeToolWithLinkedIn = vi
      .fn()
      .mockResolvedValue(
        "Profile at https://www.linkedin.com/in/john-doe and github.com/john",
      );

    mockCreate
      .mockResolvedValueOnce({
        stop_reason: "tool_use",
        content: [
          {
            type: "tool_use",
            id: "tool_123",
            name: "web_search",
            input: { query: "john doe" },
          },
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: "end_turn",
        content: [{ type: "text", text: "Done" }],
      });

    await runAgentLoop({
      ...BASE_OPTIONS,
      executeTool: executeToolWithLinkedIn,
    });

    // The second call to create should have tool results with LinkedIn URL filtered out
    const secondCall = mockCreate.mock.calls[1][0];
    const toolResultMessages = secondCall.messages;
    const lastMessage = toolResultMessages[toolResultMessages.length - 1];
    const toolResultContent = lastMessage.content[0].content as string;

    expect(toolResultContent).not.toContain("linkedin.com");
    expect(toolResultContent).toContain(
      "[blocked: LinkedIn URL removed per legal policy]",
    );
    expect(toolResultContent).toContain("github.com/john");
  });

  it("throws when tool_use steps exceed maxSteps", async () => {
    // Always return tool_use — never resolves
    mockCreate.mockResolvedValue({
      stop_reason: "tool_use",
      content: [
        {
          type: "tool_use",
          id: "tool_loop",
          name: "web_search",
          input: { query: "loop" },
        },
      ],
    });

    await expect(
      runAgentLoop({ ...BASE_OPTIONS, maxSteps: 2 }),
    ).rejects.toThrow("exceeded");
  });

  it("returns partial text on max_tokens stop reason", async () => {
    mockCreate.mockResolvedValue({
      stop_reason: "max_tokens",
      content: [{ type: "text", text: "Partial response due to token limit" }],
    });

    const result = await runAgentLoop(BASE_OPTIONS);
    expect(result).toBe("Partial response due to token limit");
  });

  it("throws on max_tokens with no text content", async () => {
    mockCreate.mockResolvedValue({
      stop_reason: "max_tokens",
      content: [
        {
          type: "tool_use",
          id: "tool_x",
          name: "web_search",
          input: {},
        },
      ],
    });

    await expect(runAgentLoop(BASE_OPTIONS)).rejects.toThrow(
      "Agent response truncated by max_tokens with no text content",
    );
  });

  it("passes cache_control ephemeral on the system prompt", async () => {
    mockCreate.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "ok" }],
    });

    await runAgentLoop(BASE_OPTIONS);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toBeDefined();
    expect(Array.isArray(callArgs.system)).toBe(true);
    expect(callArgs.system[0]).toMatchObject({
      type: "text",
      text: BASE_OPTIONS.systemPrompt,
      cache_control: { type: "ephemeral" },
    });
  });

  it("returns empty string when end_turn has no text block", async () => {
    mockCreate.mockResolvedValue({
      stop_reason: "end_turn",
      content: [],
    });

    const result = await runAgentLoop(BASE_OPTIONS);
    expect(result).toBe("");
  });

  it("does not call executeTool for server_tool_use blocks and does not push empty tool results", async () => {
    // Simulate a response with ONLY server_tool_use blocks (no custom tool_use)
    // This happens when Claude uses built-in server tools like web_search_20250305
    mockCreate
      .mockResolvedValueOnce({
        stop_reason: "tool_use",
        content: [
          {
            type: "server_tool_use",
            id: "srvtool_abc",
            name: "web_search",
            input: { query: "Atlassian engineering team" },
          },
          {
            type: "text",
            text: "Searching for contacts...",
          },
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: "end_turn",
        content: [{ type: "text", text: "Found contacts via server tool" }],
      });

    const executeToolSpy = vi.fn().mockResolvedValue("should not be called");

    const result = await runAgentLoop({
      ...BASE_OPTIONS,
      executeTool: executeToolSpy,
    });

    // executeTool must NOT be called for server_tool_use blocks
    expect(executeToolSpy).not.toHaveBeenCalled();

    // The second API call should NOT have an empty tool_result user message
    const secondCall = mockCreate.mock.calls[1][0];
    const messages = secondCall.messages as Array<{
      role: string;
      content: unknown;
    }>;
    // The last message should be the assistant message (server_tool_use blocks), not an empty user message
    const lastMsg = messages[messages.length - 1];
    expect(lastMsg.role).toBe("assistant");

    expect(result).toBe("Found contacts via server tool");
  });
});
