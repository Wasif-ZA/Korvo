// Sentry MUST be first import — instruments all subsequent imports
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "production",
  tracesSampleRate: 0.1,
});

import "dotenv/config";
import { pipelineWorker } from "./pipeline.worker";
import { gmailSendWorker } from "./gmail-send.worker";

console.log("Korvo workers started");
console.log(`  Pipeline worker: listening on pipeline-queue (concurrency: 5)`);
console.log(
  `  Gmail send worker: listening on gmail-send-queue (concurrency: 1, stub)`,
);

process.on("SIGTERM", async () => {
  console.log("SIGTERM received — draining workers...");
  await Sentry.flush(2000);
  await Promise.all([pipelineWorker.close(), gmailSendWorker.close()]);
  console.log("Workers drained, exiting");
  process.exit(0);
});
