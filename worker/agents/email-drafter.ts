import type {
  ContactResult,
  DraftResult,
  ResearchCard,
  ScoreResult,
  Tone,
} from "@/shared/types/agents";
import { runAgentLoop } from "@/worker/lib/agent-loop";
import { extractJsonObject } from "./email-guesser";

// Tone-specific prompt instructions (D-12: tone bands)
const TONE_INSTRUCTIONS: Record<Tone, string> = {
  direct:
    "Lead with a shared connection or mutual interest. Ask directly for a coffee chat or 30-minute call.",
  curious:
    "Lead with something specific you found about their work (blog post, talk, project). Ask an open-ended question about their perspective.",
  value_driven:
    "Lead with something you can offer or share (a project, a finding, a perspective). Suggest a low-commitment interaction like sharing a resource.",
};

/**
 * Builds the system prompt for the Email Drafter agent based on the contact's score tone.
 * D-11: Casual/direct voice, max 4 sentences.
 * D-12: Tone bands drive different opening strategies.
 */
export function buildDrafterSystemPrompt(tone: Tone): string {
  return `You draft cold networking emails for junior software engineers seeking informational interviews and coffee chats.

VOICE: Genuine, curious, direct. Show that research was done. No corporate speak.
LENGTH: Exactly 4 sentences. No more.
FORBIDDEN: Em dashes, "I hope this finds you well", "I wanted to reach out", "synergy", "leverage", "circle back", "thrilled", "excited to"
TONE: ${TONE_INSTRUCTIONS[tone]}

Return JSON only:
{
  "subject": "brief, specific subject line (max 8 words)",
  "body": "4 sentences. First sentence: [tone opening]. Second: [specific hook]. Third: [ask/offer]. Fourth: [light sign-off].",
  "template_type": "referral_ask" | "hiring_inquiry" | "value_offer",
  "hook_used": "which personalization hook was used"
}`;
}

/**
 * Validates the template type returned by the LLM.
 * Follow-up types (followup_1, followup_2) exist in the TemplateType union (D-13)
 * but are not populated by the drafter — reserved for V3 follow-up automation.
 * Defaults to "hiring_inquiry" if value is invalid or unrecognized.
 */
export function validateTemplateType(
  raw: unknown,
): "referral_ask" | "hiring_inquiry" | "value_offer" {
  if (
    raw === "referral_ask" ||
    raw === "hiring_inquiry" ||
    raw === "value_offer"
  ) {
    return raw;
  }
  return "hiring_inquiry";
}

/**
 * Generates a simple 4-sentence fallback email based on tone.
 * Uses research hooks if available. Template type defaults to "hiring_inquiry".
 *
 * D-03: Ensures the pipeline never crashes even when the LLM fails.
 */
export function generateFallbackDraft(
  contact: ContactResult,
  research: ResearchCard,
  score: ScoreResult,
  targetRole: string,
  userName: string,
): DraftResult {
  const hook =
    research.hooks[0] ?? research.mentionThis ?? "your work in the space";

  const bodyByTone: Record<Tone, string> = {
    direct: `Hi ${contact.name}, I came across your profile while exploring ${targetRole} opportunities and noticed ${hook}. As a ${contact.title}, your perspective on the space would be genuinely valuable to me. Would you be open to a quick 20-minute coffee chat? No agenda, just keen to learn. Best, ${userName}`,
    curious: `Hi ${contact.name}, I've been following ${hook} and had a question I thought you might find interesting to weigh in on. As someone exploring ${targetRole} roles, your perspective would be genuinely useful. What's the one thing you wish you'd known earlier in your path into this space? Happy to share what I'm working on too. Thanks, ${userName}`,
    value_driven: `Hi ${contact.name}, I've been building in the ${targetRole} space and came across ${hook}, which made me think you might find something I'm working on useful. I'd be happy to share a project or relevant finding, no strings attached. Would a brief async exchange work for you? Cheers, ${userName}`,
  };

  let body = bodyByTone[score.tone];
  // Sanitize em dashes even in fallback bodies
  body = body.replace(/\u2014/g, ",").replace(/--/g, ",");

  return {
    subject: `${targetRole} chat — quick question`,
    body,
    templateType: "hiring_inquiry",
    hookUsed: hook,
  };
}

export interface DraftInput {
  contact: ContactResult;
  research: ResearchCard;
  score: ScoreResult;
  targetRole: string;
  userName: string;
}

/**
 * Drafts personalized cold emails for a list of contacts.
 *
 * Given contacts, research cards, and scores, produces one DraftResult per
 * contact. Tone from the scoring engine (direct/curious/value_driven) drives
 * the prompt strategy per D-12. All drafts are 4 sentences max, no em dashes.
 *
 * D-03: Never throws — returns a fallback draft on any per-contact failure.
 */
export async function draftEmails(
  inputs: DraftInput[],
): Promise<DraftResult[]> {
  const results: DraftResult[] = [];

  for (const { contact, research, score, targetRole, userName } of inputs) {
    try {
      const systemPrompt = buildDrafterSystemPrompt(score.tone);

      const userMessage = `Draft a cold email to ${contact.name} (${contact.title}).

Research:
- Background: ${research.background}
- Mention: ${research.mentionThis}
- Hooks: ${research.hooks.join(", ") || "none found"}

Score: ${score.total}/100 (tone: ${score.tone})
Target role: ${targetRole}
My name: ${userName}

Return JSON only.`;

      const rawOutput = await runAgentLoop({
        systemPrompt,
        userMessage,
        tools: [], // No tools needed — drafter works from provided context
        executeTool: async () => "",
        maxSteps: 2,
        maxTokens: 1024,
      });

      const parsed = extractJsonObject(rawOutput);

      // Sanitize body: remove em dashes (U+2014) and double dashes per FORBIDDEN list
      let body = typeof parsed.body === "string" ? parsed.body : "";
      body = body.replace(/\u2014/g, ",").replace(/--/g, ",");

      results.push({
        subject:
          typeof parsed.subject === "string" && parsed.subject.length > 0
            ? parsed.subject
            : `Connecting about ${targetRole}`,
        body,
        templateType: validateTemplateType(parsed.template_type),
        hookUsed:
          typeof parsed.hook_used === "string"
            ? parsed.hook_used
            : (research.hooks[0] ?? ""),
      });
    } catch {
      // D-03: Never fail — generate a safe fallback draft
      results.push(
        generateFallbackDraft(contact, research, score, targetRole, userName),
      );
    }
  }

  return results;
}
