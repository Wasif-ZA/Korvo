import { z } from "zod";
import type { ContactResult, EmailGuess } from "@/shared/types/agents";
import { runAgentLoop } from "@/worker/lib/agent-loop";

// AGENT-09: LinkedIn blocklist enforced via agent-loop's filterBlockedUrls
export const EMAIL_GUESSER_SYSTEM_PROMPT = `You are an email pattern detective. Given a person's name and their company domain, you find or infer their business email address.

Strategy (in order):
1. Search for their name + company in blog posts, author bios, GitHub commits, job listing cc fields
2. If direct email found, return with confidence "high"
3. If email pattern for company found (e.g., first@company.com from other employees), apply pattern, return "medium"
4. If no pattern found, return most common patterns (first.last@, firstl@, first@), return "low"

CRITICAL: Never access linkedin.com. Return JSON only.

OUTPUT FORMAT:
{
  "email": "first.last@company.com",
  "confidence": "high" | "medium" | "low",
  "pattern_source": "found in blog author bio" | "inferred from company pattern" | "guessed"
}`;

// Zod schema for validating Claude's JSON output
const EmailGuessSchema = z.object({
  email: z.string().email(),
  confidence: z.enum(["high", "medium", "low"]),
  pattern_source: z.string(),
});

/**
 * Generates a fallback email using first.last@domain pattern.
 * Handles single-name case by using just first@domain.
 */
export function generateFallbackEmail(name: string, domain: string): string {
  const parts = name.trim().toLowerCase().split(/\s+/);
  const normalizedDomain = domain.toLowerCase();
  if (parts.length === 0 || !parts[0]) {
    return `unknown@${normalizedDomain}`;
  }
  if (parts.length === 1) {
    return `${parts[0]}@${normalizedDomain}`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first}.${last}@${normalizedDomain}`;
}

/**
 * Extracts a JSON object from Claude's response, which may be wrapped in
 * markdown code fences or contain surrounding text.
 */
export function extractJsonObject(raw: string): Record<string, unknown> {
  // Try to find JSON inside code fences first
  const codeFenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = codeFenceMatch ? codeFenceMatch[1].trim() : raw.trim();

  // Find the first { and last } to extract the JSON object
  const start = jsonString.indexOf("{");
  const end = jsonString.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in response");
  }

  const jsonSlice = jsonString.slice(start, end + 1);
  return JSON.parse(jsonSlice) as Record<string, unknown>;
}

/**
 * Given a list of contacts and their company domain, guesses email addresses
 * using Claude Haiku with web search.
 *
 * D-03: Never throws — returns low-confidence fallback on any per-contact failure.
 */
export async function guessEmails(
  contacts: ContactResult[],
  companyDomain: string,
): Promise<EmailGuess[]> {
  const results: EmailGuess[] = [];

  for (const contact of contacts) {
    try {
      const userMessage = `Find or guess the email for ${contact.name}, ${contact.title} at domain ${companyDomain}. Return JSON only.`;

      const rawOutput = await runAgentLoop({
        systemPrompt: EMAIL_GUESSER_SYSTEM_PROMPT,
        userMessage,
        tools: [
          {
            type: "web_search_20250305" as unknown as "custom",
            name: "web_search",
            description: "Search the web for email patterns",
            input_schema: {
              type: "object" as const,
              properties: {
                query: { type: "string", description: "Search query" },
              },
              required: ["query"],
            },
          },
        ],
        executeTool: async () => "",
        maxSteps: 3, // Pitfall C: limit steps to control costs
        maxTokens: 1024,
      });

      const parsed = extractJsonObject(rawOutput);
      const validated = EmailGuessSchema.safeParse(parsed);

      if (validated.success) {
        results.push({
          email: validated.data.email,
          confidence: validated.data.confidence,
          patternSource: validated.data.pattern_source,
        });
      } else {
        // Zod validation failed — use fallback with whatever email we can get
        const rawEmail = typeof parsed.email === "string" ? parsed.email : null;
        results.push({
          email: rawEmail ?? generateFallbackEmail(contact.name, companyDomain),
          confidence: "low",
          patternSource: "guessed from common patterns (validation failed)",
        });
      }
    } catch {
      // D-03: Never fail — return best guess on any error
      results.push({
        email: generateFallbackEmail(contact.name, companyDomain),
        confidence: "low",
        patternSource: "guessed from common patterns (agent failed)",
      });
    }
  }

  return results;
}
