import { Worker } from "bullmq";
import { workerConnection } from "./lib/redis";
import { QUEUE_NAMES } from "@/shared/queues";
import type { PipelineJobData } from "@/shared/types/jobs";
import { runPipeline } from "./orchestrator/pipeline";

export const pipelineWorker = new Worker<PipelineJobData>(
  QUEUE_NAMES.PIPELINE,
  async (job) => {
    await runPipeline(job);
  },
  {
    connection: workerConnection,
    concurrency: 5,
  },
);

pipelineWorker.on("failed", (job, err) => {
  console.error(`Pipeline job ${job?.id} failed:`, err.message);
});

pipelineWorker.on("completed", (job) => {
  console.log(`Pipeline job ${job.id} completed`);
});
