import type Anthropic from "@anthropic-ai/sdk";
import { claude, HAIKU_MODEL } from "./claude-client";
import { filterBlockedUrls } from "./linkedin-blocklist";
import pRetry from "p-retry";

export interface AgentLoopOptions {
  systemPrompt: string;
  userMessage: string;
  tools: Anthropic.Tool[];
  executeTool: (
    name: string,
    input: Record<string, unknown>,
  ) => Promise<string>;
  maxSteps?: number;
  maxTokens?: number;
  model?: string;
}

export async function runAgentLoop(options: AgentLoopOptions): Promise<string> {
  const {
    systemPrompt,
    userMessage,
    tools,
    executeTool,
    maxSteps = 5,
    maxTokens = 2048,
    model = HAIKU_MODEL,
  } = options;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  let steps = 0;
  while (steps < maxSteps) {
    const response = await pRetry(
      () =>
        claude.messages.create({
          model,
          max_tokens: maxTokens,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" }, // AGENT-06: prompt caching
            },
          ],
          tools,
          messages,
        }),
      { retries: 3, minTimeout: 1000, factor: 2 }, // D-20: 3x retry with exponential backoff
    );

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.text ?? "";
    }

    if (response.stop_reason === "max_tokens") {
      // Pitfall G: truncated response — return what we have
      const textBlock = response.content.find((b) => b.type === "text");
      if (textBlock?.text) return textBlock.text;
      throw new Error(
        "Agent response truncated by max_tokens with no text content",
      );
    }

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        let result = await executeTool(
          block.name,
          block.input as Record<string, unknown>,
        );
        // AGENT-09: Filter LinkedIn URLs from all tool results before feeding back to Claude
        result = filterBlockedUrls(result);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
      messages.push({ role: "user", content: toolResults });
      steps++;
      continue;
    }

    // Unknown stop reason — break
    break;
  }

  throw new Error(`Agent loop exceeded ${maxSteps} steps without completing`);
}
