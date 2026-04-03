import { Worker } from "bullmq";
import { workerConnection } from "./lib/redis";
import { QUEUE_NAMES } from "@/shared/queues";
import type { GmailSendJobData } from "@/shared/types/jobs";

export const gmailSendWorker = new Worker<GmailSendJobData>(
  QUEUE_NAMES.GMAIL_SEND,
  async (job) => {
    // Phase 5 will implement actual Gmail API send
    console.log(
      `Gmail send job ${job.id} received (stub — not implemented until Phase 5)`,
    );
  },
  {
    connection: workerConnection,
    concurrency: 1,
  },
);

gmailSendWorker.on("failed", (job, err) => {
  console.error(`Gmail send job ${job?.id} failed:`, err.message);
});
