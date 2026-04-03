export const QUEUE_NAMES = {
  PIPELINE: "pipeline-queue",
  GMAIL_SEND: "gmail-send-queue",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
