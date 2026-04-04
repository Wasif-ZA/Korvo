// worker/gmail-send.worker.ts
// Full Gmail API send worker — replaces stub from Phase 4.
// Decrypts refresh token, sends via Gmail API, marks outreach as sent,
// moves contact to "contacted" stage, tracks bounces and handles invalid_grant.
// Unsubscribe footer is already appended by the send route at enqueue time (D-14).
import { google } from "googleapis";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { workerConnection } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { QUEUE_NAMES } from "@/shared/queues";
import type { GmailSendJobData } from "@/shared/types/jobs";
import { decryptToken } from "@/lib/gmail/token-crypto";
import { getOAuth2Client } from "@/lib/gmail/oauth-client";
import {
  checkAndIncrementDaily,
  markFirstSend,
  recordBounce,
  checkBounceRate,
} from "@/lib/gmail/send-quota";

// Dedicated Redis client for deliverability counters in worker context
const redis = new IORedis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
  family: Number(process.env.REDIS_FAMILY ?? 4),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * Builds an RFC2822 message string and base64url encodes it for Gmail API.
 * Gmail API requires raw base64url-encoded RFC2822 messages.
 */
function buildRawMessage(to: string, subject: string, body: string): string {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Checks if an error is an invalid_grant error from Google OAuth.
 * Occurs when the refresh token has been revoked or expired.
 */
function isInvalidGrantError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("invalid_grant") ||
      (error as unknown as { response?: { data?: { error?: string } } })
        .response?.data?.error === "invalid_grant"
    );
  }
  return false;
}

/**
 * Checks if an error indicates an invalid/non-existent email address (hard bounce).
 * Gmail API returns 5xx SMTP errors for undeliverable addresses.
 */
function isBounceLikeError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("invalid") ||
      msg.includes("does not exist") ||
      msg.includes("no such user") ||
      msg.includes("user unknown") ||
      msg.includes("mailbox not found")
    );
  }
  return false;
}

export const gmailSendWorker = new Worker<GmailSendJobData>(
  QUEUE_NAMES.GMAIL_SEND,
  async (job) => {
    const { outreachId, userId, contactId, to, subject, body } = job.data;

    // Defense-in-depth rate check (the send route already checked, but worker verifies again)
    const rateCheck = await checkAndIncrementDaily(userId, redis);
    if (!rateCheck.allowed) {
      throw new Error(
        `Daily send limit reached for user ${userId}: ${rateCheck.used}/${rateCheck.limit}`,
      );
    }

    // Load and decrypt Gmail refresh token
    const tokenRecord = await prisma.gmailToken.findUnique({
      where: { userId },
      select: { encryptedRefreshToken: true },
    });

    if (!tokenRecord) {
      throw new Error(`Gmail not connected for user ${userId}`);
    }

    const refreshToken = decryptToken(tokenRecord.encryptedRefreshToken);

    // Build OAuth2Client with stored refresh token
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
      // Build and send Gmail message
      const raw = buildRawMessage(to, subject, body);
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });

      // Mark outreach as sent via Gmail API
      await prisma.outreach.update({
        where: { id: outreachId },
        data: {
          sentAt: new Date(),
          sentVia: "gmail_api",
        },
      });

      // Auto-move contact to "contacted" pipeline stage (SEND-06, D-07)
      await prisma.contact.update({
        where: { id: contactId },
        data: { pipelineStage: "contacted" },
      });

      // Record first send for warm-up ramp (only sets if not already set via SETNX)
      await markFirstSend(userId, redis);
    } catch (error: unknown) {
      // Handle invalid_grant: refresh token revoked or expired (D-03, D-04)
      // Do not retry — the user must reconnect Gmail
      if (isInvalidGrantError(error)) {
        await prisma.gmailToken.delete({ where: { userId } }).catch(() => {
          // Token may already be deleted — ignore error
        });
        await redis.set(`gmail:reconnect_required:${userId}`, "true");
        // Do not rethrow — job is "complete" (user action required, not a retry scenario)
        return;
      }

      // Handle bounce-like errors: invalid addresses (D-12)
      // Record bounce, check if suspension threshold reached, do not retry
      if (isBounceLikeError(error)) {
        await recordBounce(userId, to, redis);
        await checkBounceRate(userId, redis);
        // Do not rethrow — job complete, address is bad
        return;
      }

      // All other errors: rethrow for BullMQ retry
      throw error;
    }
  },
  {
    connection: workerConnection,
    concurrency: 1,
  },
);

gmailSendWorker.on("failed", (job, err) => {
  console.error(`Gmail send job ${job?.id} failed:`, err.message);
});
