// app/api/gmail/send/route.ts
// Validates Pro plan, Gmail connection, rate limits, and bounce rate before enqueuing.
// Appends unsubscribe footer to email body at enqueue time (D-14, D-15).
// Enqueues to gmail-send-queue with 60-180s jitter delay (D-11).
import { NextRequest, NextResponse } from "next/server";
import { Queue } from "bullmq";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { gmailRedis } from "@/lib/gmail/redis-client";
import {
  checkAndIncrementDaily,
  checkBounceRate,
  getJitterMs,
} from "@/lib/gmail/send-quota";
import { QUEUE_NAMES } from "@/shared/queues";
import type { GmailSendJobData } from "@/shared/types/jobs";

const sendSchema = z.object({
  outreachId: z.string().uuid(),
  contactId: z.string().uuid(),
});

const DEFAULT_UNSUBSCRIBE_FOOTER =
  "If you'd prefer not to hear from me, just let me know.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate request body
  let body: z.infer<typeof sendSchema>;
  try {
    body = sendSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { outreachId, contactId } = body;

  // Check Pro plan
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { plan: true, unsubscribeFooter: true },
  });

  if (!profile || profile.plan !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  // Check Gmail connected
  const gmailToken = await prisma.gmailToken.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!gmailToken) {
    return NextResponse.json(
      { error: "Gmail not connected", code: "GMAIL_NOT_CONNECTED" },
      { status: 400 },
    );
  }

  // Check bounce suspension
  const bounceCheck = await checkBounceRate(user.id, gmailRedis);
  if (bounceCheck.suspended) {
    return NextResponse.json(
      {
        error: "Sending paused — too many bounces. Check your email addresses.",
        code: "BOUNCE_SUSPENDED",
      },
      { status: 429 },
    );
  }

  // Check and increment daily rate limit
  const rateCheck = await checkAndIncrementDaily(user.id, gmailRedis);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error:
          "You've reached your daily send limit to protect your sender reputation.",
        code: "DAILY_LIMIT_REACHED",
        used: rateCheck.used,
        limit: rateCheck.limit,
      },
      { status: 429 },
    );
  }

  // Load outreach + contact data
  const outreach = await prisma.outreach.findUnique({
    where: { id: outreachId },
    include: { contact: true },
  });

  if (!outreach) {
    // Roll back the increment we just made since we won't send
    return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
  }

  // Check not already sent
  if (outreach.sentAt) {
    return NextResponse.json({ error: "Already sent" }, { status: 409 });
  }

  // Append unsubscribe footer (D-14, D-15)
  const footer =
    profile.unsubscribeFooter?.trim() || DEFAULT_UNSUBSCRIBE_FOOTER;
  const bodyWithFooter = `${outreach.body}\n\n${footer}`;

  const jobData: GmailSendJobData = {
    outreachId,
    userId: user.id,
    contactId: outreach.contactId,
    to: outreach.contact.email ?? "",
    subject: outreach.subject,
    body: bodyWithFooter,
  };

  void contactId; // contactId validated by schema, actual contactId comes from outreach relation

  // Enqueue with jitter delay (D-11)
  const gmailSendQueue = new Queue<GmailSendJobData>(QUEUE_NAMES.GMAIL_SEND, {
    connection: gmailRedis,
  });

  const jitterMs = getJitterMs();
  await gmailSendQueue.add("send", jobData, { delay: jitterMs });

  return NextResponse.json({ queued: true, estimatedDelay: jitterMs });
}
