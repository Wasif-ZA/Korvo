import { z } from "zod";
import type { ContactResult } from "@/shared/types/agents";
import { runAgentLoop } from "@/worker/lib/agent-loop";

// AGENT-09: LinkedIn blocklist enforced in system prompt + agent-loop filterBlockedUrls
export const CONTACT_FINDER_SYSTEM_PROMPT = `You are a professional researcher helping a junior software engineer find relevant contacts at companies to reach out to for networking.

Your goal is to find exactly 3 people at the target company who match the target role. Prioritize:
1. Engineering managers or team leads (not VPs/CTOs — too senior)
2. Senior engineers who hire or mentor
3. Mid-level engineers in the relevant team

CRITICAL RULES:
- Never access linkedin.com URLs. If search returns LinkedIn links, do not fetch them.
- Only use: company team pages, GitHub org pages, engineering blogs, conference speaker lists, press releases, Stack Overflow teams pages
- Always return exactly 3 contacts. If you find fewer, include lower-confidence results with a note.
- Return valid JSON matching the specified schema.

OUTPUT FORMAT: Return a JSON array of exactly 3 objects:
[
  {
    "name": "First Last",
    "title": "Senior Software Engineer",
    "source_url": "https://company.com/team",
    "confidence": "high" | "medium" | "low",
    "public_activity": "brief note on GitHub/blog/talks found or null"
  }
]`;

// Zod schema for validating a single contact from Claude's JSON output (snake_case from LLM)
const RawContactSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  source_url: z.string().url().nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]),
  public_activity: z.string().nullable().optional(),
});

type RawContact = z.infer<typeof RawContactSchema>;

/**
 * Extract a JSON array from Claude's response, handling markdown code fences.
 */
function extractJsonArray(text: string): unknown[] {
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : text.trim();

  // Find the outermost JSON array
  const arrayStart = candidate.indexOf("[");
  const arrayEnd = candidate.lastIndexOf("]");
  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
    return [];
  }

  try {
    const parsed = JSON.parse(candidate.slice(arrayStart, arrayEnd + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Map a raw (possibly snake_case) LLM contact object to a validated ContactResult.
 * Returns a low-confidence placeholder on validation failure.
 */
function mapToContactResult(raw: unknown): ContactResult {
  const result = RawContactSchema.safeParse(raw);
  if (!result.success) {
    return {
      name: "Unknown Contact",
      title: "Unknown",
      sourceUrl: null,
      confidence: "low",
      publicActivity: null,
    };
  }

  const c: RawContact = result.data;
  return {
    name: c.name,
    title: c.title,
    sourceUrl: c.source_url ?? null,
    confidence: c.confidence,
    publicActivity: c.public_activity ?? null,
  };
}

/**
 * Find exactly 3 relevant contacts at a target company using Claude Haiku + web search.
 *
 * D-03: Always returns exactly 3 ContactResult objects. Pads with low-confidence
 * placeholders if fewer are found. Never throws — returns placeholders on error.
 *
 * AGENT-07 (partial): L1 (Claude web search) only. L2+ deferred per D-01.
 */
export async function findContacts(
  company: string,
  role: string,
  location: string | null,
): Promise<ContactResult[]> {
  // Dynamic content in user message only — system prompt is cached (AGENT-06)
  const userMessage = `Find 3 contacts at ${company} relevant to the role: ${role}. Location: ${location ?? "any"}. Return JSON only.`;

  let rawOutput = "";
  try {
    rawOutput = await runAgentLoop({
      systemPrompt: CONTACT_FINDER_SYSTEM_PROMPT,
      userMessage,
      // Server tool — type cast required as SDK types don't expose server tool variants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [
        { type: "web_search_20250305" as any, name: "web_search", max_uses: 5 },
      ],
      executeTool: async () => "", // Server tools are handled by the Claude API, not by us
      maxSteps: 5,
      maxTokens: 2048,
    });
  } catch {
    // Never throw to caller — return 3 low-confidence placeholders
    rawOutput = "";
  }

  // Parse and validate JSON output
  const rawArray = extractJsonArray(rawOutput);
  const contacts: ContactResult[] = rawArray.map(mapToContactResult);

  // D-03: Always return exactly 3 contacts
  while (contacts.length < 3) {
    contacts.push({
      name: "Unknown Contact",
      title: "Unknown",
      sourceUrl: null,
      confidence: "low",
      publicActivity: null,
    });
  }

  return contacts.slice(0, 3);
}
