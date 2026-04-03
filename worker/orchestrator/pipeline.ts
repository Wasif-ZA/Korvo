import type { Job } from "bullmq";
import type { PipelineJobData } from "@/shared/types/jobs";
import type {
  ContactResult,
  CompanyEnrichmentData,
  ScoreResult,
} from "@/shared/types/agents";
import { prisma } from "../lib/prisma";
import { broadcastProgress } from "../lib/supabase";
import { findContacts } from "../agents/contact-finder";
import { guessEmails } from "../agents/email-guesser";
import { researchContacts } from "../agents/research-agent";
import { draftEmails } from "../agents/email-drafter";
import { extractSignals, scoreContact } from "../scoring/scoring-engine";
import { getCompanyEnrichment } from "../lib/firecrawl";

const PIPELINE_TIMEOUT_MS = 3 * 60 * 1000; // D-21: 3-minute total timeout

export async function runPipeline(job: Job<PipelineJobData>): Promise<void> {
  const { searchId, company, role, location } = job.data;

  await prisma.search.update({
    where: { id: searchId },
    data: { status: "processing" },
  });

  const timeoutId = setTimeout(async () => {
    await prisma.search.update({
      where: { id: searchId },
      data: { status: "failed" },
    });
  }, PIPELINE_TIMEOUT_MS);

  try {
    // Derive company domain from company name (simple heuristic)
    const companyDomain = deriveCompanyDomain(company);

    // Step 1: Contact Finder
    const contacts = await findContacts(company, role, location);
    await broadcastProgress(searchId, "contacts_found");
    await job.updateProgress(25);

    // Write contacts to DB
    const contactRows = await Promise.all(
      contacts.map((c) =>
        prisma.contact.create({
          data: {
            searchId,
            name: c.name,
            title: c.title,
            sourceUrl: c.sourceUrl,
            emailConfidence: c.confidence,
          },
        }),
      ),
    );

    // Step 2: Parallel — Email Guesser + Research Agent
    const [emailGuesses, researchCards] = await Promise.all([
      guessEmails(contacts, companyDomain),
      researchContacts(contacts, company, companyDomain),
    ]);

    await broadcastProgress(searchId, "emails_guessed");
    await broadcastProgress(searchId, "research_done");
    await job.updateProgress(75);

    // Update contacts with email guesses and research
    // Also get company enrichment for scoring
    const enrichment = (await getCompanyEnrichment(
      companyDomain,
    )) as CompanyEnrichmentData | null;

    // Track scores per contact index (typed — avoids attaching data to ContactResult)
    const scores: ScoreResult[] = [];

    for (let i = 0; i < contactRows.length; i++) {
      const guess = emailGuesses[i];
      const research = researchCards[i];

      // IMPORTANT: extractSignals reads `contact.confidence` for emailConfidenceScore.
      // The email guess confidence should override the contact finder's confidence
      // because it specifically reflects email accuracy, which is what the scoring
      // engine's emailConfidenceScore dimension measures.
      const contactForScoring: ContactResult = {
        ...contacts[i],
        confidence: guess?.confidence ?? "low",
      };
      const signals = extractSignals(contactForScoring, role, enrichment);
      const score = scoreContact(signals);
      scores.push(score);

      await prisma.contact.update({
        where: { id: contactRows[i].id },
        data: {
          email: guess?.email ?? null,
          emailConfidence: guess?.confidence ?? "low",
          score: score.total,
          scoreBreakdown: score.breakdown,
          researchBackground: research?.background ?? null,
          researchAskThis: research?.askThis ?? null,
          researchMentionThis: research?.mentionThis ?? null,
        },
      });
    }

    // Step 3: Email Drafter (uses scores + research from step 2)
    const draftInputs = contacts.map((c, i) => ({
      contact: c,
      research: researchCards[i],
      score: scores[i],
      targetRole: role,
      userName: "there", // Generic — user name comes from profile in Phase 4
    }));

    const drafts = await draftEmails(draftInputs);
    await broadcastProgress(searchId, "drafts_ready");
    await job.updateProgress(100);

    // Write drafts to outreach table
    for (let i = 0; i < contactRows.length; i++) {
      const draft = drafts[i];
      if (draft) {
        await prisma.outreach.create({
          data: {
            contactId: contactRows[i].id,
            templateType: draft.templateType,
            subject: draft.subject,
            body: draft.body,
            tone: scores[i]?.tone ?? "curious",
          },
        });
      }
    }

    await prisma.search.update({
      where: { id: searchId },
      data: { status: "completed" },
    });
  } catch (err) {
    console.error(`[pipeline] Failed for search ${searchId}:`, err);
    await prisma.search.update({
      where: { id: searchId },
      data: { status: "failed" },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function deriveCompanyDomain(company: string): string {
  // Simple heuristic: lowercase, remove spaces, add .com
  // In V2, use a domain lookup API
  const cleaned = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleaned}.com`;
}
