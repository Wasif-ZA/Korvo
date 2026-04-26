import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { isDemoMode } from "@/lib/demo/guards";
import { DEMO_CONTACTS } from "@/lib/demo/seed";

export async function GET() {
  if (isDemoMode()) {
    const totalContacts = DEMO_CONTACTS.length;
    const emailsSent = DEMO_CONTACTS.filter((c) =>
      ["contacted", "responded", "chatted", "applied", "interviewing"].includes(
        c.pipelineStage,
      ),
    ).length;
    const repliesReceived = DEMO_CONTACTS.filter((c) =>
      ["responded", "chatted", "applied", "interviewing"].includes(
        c.pipelineStage,
      ),
    ).length;
    const replyRate =
      totalContacts > 0
        ? Math.round((repliesReceived / totalContacts) * 100)
        : 0;
    return NextResponse.json({
      success: true,
      plan: "pro",
      data: [
        { label: "Total Contacts", value: totalContacts },
        { label: "Emails Sent", value: emailsSent },
        {
          label: "Replies Received",
          value: repliesReceived,
          color: "success",
        },
        {
          label: "Reply Rate",
          value: `${replyRate}%`,
          color:
            replyRate > 20 ? "success" : replyRate > 10 ? "warning" : "error",
        },
      ],
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Aggregate stats for the user (parallel queries for performance)
  const [totalContacts, emailsSent, repliesReceived, profile] =
    await Promise.all([
      prisma.contact.count({
        where: { search: { userId: user.id } },
      }),
      prisma.contact.count({
        where: {
          search: { userId: user.id },
          pipelineStage: {
            in: [
              "contacted",
              "responded",
              "chatted",
              "applied",
              "interviewing",
            ],
          },
        },
      }),
      prisma.contact.count({
        where: {
          search: { userId: user.id },
          pipelineStage: {
            in: ["responded", "chatted", "applied", "interviewing"],
          },
        },
      }),
      prisma.profile.findUnique({
        where: { userId: user.id },
        select: { plan: true },
      }),
    ]);

  const replyRate =
    totalContacts > 0 ? Math.round((repliesReceived / totalContacts) * 100) : 0;

  return NextResponse.json({
    success: true,
    plan: profile?.plan ?? "free",
    data: [
      { label: "Total Contacts", value: totalContacts },
      { label: "Emails Sent", value: emailsSent },
      { label: "Replies Received", value: repliesReceived, color: "success" },
      {
        label: "Reply Rate",
        value: `${replyRate}%`,
        color:
          replyRate > 20 ? "success" : replyRate > 10 ? "warning" : "error",
      },
    ],
  });
}
