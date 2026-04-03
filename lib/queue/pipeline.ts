import { Queue } from "bullmq";
import { queueConnection } from "@/lib/queue/redis";
import { QUEUE_NAMES } from "@/shared/queues";

export const pipelineQueue = new Queue(QUEUE_NAMES.PIPELINE, {
  connection: queueConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});
