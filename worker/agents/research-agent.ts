import type { ContactResult, ResearchCard } from "@/shared/types/agents";
import { runAgentLoop } from "@/worker/lib/agent-loop";
import { getCompanyEnrichment } from "@/worker/lib/firecrawl";
import { extractJsonObject } from "./email-guesser";

// AGENT-09: LinkedIn blocklist enforced via agent-loop's filterBlockedUrls
export const RESEARCH_AGENT_SYSTEM_PROMPT = `You are a research assistant preparing personalization hooks for cold networking emails. Given a contact's name, title, company, and company enrichment data, find specific things to reference in an email.

OUTPUT three sections:
1. Background: 2-3 sentences about the person's professional background based on public info
2. Ask This: A specific question to ask them (about their work, a project, their team)
3. Mention This: Something specific to reference that shows you did research (blog post, talk, open source project, company initiative)

Also extract 2-4 short personalization hooks (e.g., "spoke at JSConf 2025", "maintains react-query", "team is hiring seniors").

CRITICAL: Never access linkedin.com. Return JSON only.

OUTPUT FORMAT:
{
  "background": "...",
  "ask_this": "...",
  "mention_this": "...",
  "hooks": ["hook1", "hook2", "hook3"]
}`;

/**
 * Researches a list of contacts and returns structured ResearchCard objects.
 *
 * Calls getCompanyEnrichment once per search (not per contact — prevents redundant
 * Firecrawl scrapes). Falls back gracefully if Firecrawl or Claude fails.
 */
export async function researchContacts(
  contacts: ContactResult[],
  company: string,
  companyDomain: string,
): Promise<ResearchCard[]> {
  // Step 1: Get company enrichment once for all contacts (Pitfall I prevention)
  const enrichment = await getCompanyEnrichment(companyDomain);

  // Step 2: Research each contact
  const results: ResearchCard[] = [];
  for (const contact of contacts) {
    try {
      const enrichmentContext = enrichment
        ? `Company enrichment data:\n- Tech stack: ${enrichment.techStack.join(", ")}\n- Recent news: ${enrichment.recentNews.join("; ")}\n- Values: ${enrichment.companyValues.join("; ")}\n- Hiring roles: ${enrichment.hiringRoles.join(", ")}\n- Team size: ${enrichment.teamSize ?? "unknown"}`
        : "No company enrichment available. Use web search to find personalization hooks.";

      const userMessage = `Research ${contact.name}, ${contact.title} at ${company} (${companyDomain}).\n\n${enrichmentContext}\n\nReturn JSON only.`;

      const rawOutput = await runAgentLoop({
        systemPrompt: RESEARCH_AGENT_SYSTEM_PROMPT,
        userMessage,
        tools: [
          {
            type: "web_search_20250305" as unknown as "custom",
            name: "web_search",
            description: "Search the web for information about the contact",
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
        maxSteps: 3,
        maxTokens: 1536,
      });

      const parsed = extractJsonObject(rawOutput);
      results.push({
        background:
          typeof parsed.background === "string"
            ? parsed.background
            : `${contact.name} is a ${contact.title} at ${company}.`,
        askThis:
          typeof parsed.ask_this === "string"
            ? parsed.ask_this
            : `What's it like working as a ${contact.title} at ${company}?`,
        mentionThis:
          typeof parsed.mention_this === "string"
            ? parsed.mention_this
            : `I noticed ${company}'s engineering team and wanted to connect.`,
        hooks: Array.isArray(parsed.hooks) ? (parsed.hooks as string[]) : [],
      });
    } catch {
      // Never throw — return fallback ResearchCard on any error
      results.push({
        background: `${contact.name} is a ${contact.title} at ${company}.`,
        askThis: `What's it like working as a ${contact.title} at ${company}?`,
        mentionThis: `I'm interested in ${company}'s work and wanted to connect.`,
        hooks: [],
      });
    }
  }

  return results;
}
