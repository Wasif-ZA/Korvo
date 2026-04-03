import type { Job } from "bullmq";
import type { PipelineJobData } from "@/shared/types/jobs";
import { prisma } from "../lib/prisma";
import { broadcastProgress } from "../lib/supabase";

const PIPELINE_TIMEOUT_MS = 3 * 60 * 1000; // D-04: 3-minute total timeout

export async function runPipeline(job: Job<PipelineJobData>): Promise<void> {
  const { searchId } = job.data;

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
    // Step 1: Contact Finder (Phase 3 replaces stub)
    console.log(`[${searchId}] Contact Finder running...`);
    await new Promise<void>((r) => setTimeout(r, 100)); // stub delay
    await broadcastProgress(searchId, "contacts_found");
    await job.updateProgress(25);

    // Step 2: Parallel — Email Guesser + Research Agent
    await Promise.all([
      (async () => {
        console.log(`[${searchId}] Email Guesser running...`);
        await new Promise<void>((r) => setTimeout(r, 100)); // stub
        await broadcastProgress(searchId, "emails_guessed");
      })(),
      (async () => {
        console.log(`[${searchId}] Research Agent running...`);
        await new Promise<void>((r) => setTimeout(r, 100)); // stub
        await broadcastProgress(searchId, "research_done");
      })(),
    ]);
    await job.updateProgress(75);

    // Step 3: Email Drafter (waits for both parallel steps)
    console.log(`[${searchId}] Email Drafter running...`);
    await new Promise<void>((r) => setTimeout(r, 100)); // stub
    await broadcastProgress(searchId, "drafts_ready");
    await job.updateProgress(100);

    await prisma.search.update({
      where: { id: searchId },
      data: { status: "completed" },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
