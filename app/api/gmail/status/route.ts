// app/api/gmail/status/route.ts
// Returns Gmail connection status, daily send counter, and suspension flags (D-10).
// Used by the UI to show "X/Y sent today" and disable send button when limit reached.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { gmailRedis } from "@/lib/gmail/redis-client";
import { getDailyKey, getDailyLimit } from "@/lib/gmail/send-quota";
import { isDemoMode } from "@/lib/demo/guards";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  if (isDemoMode()) {
    return NextResponse.json({
      connected: true,
      gmailEmail: "demo@korvo.local",
      connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dailySent: 4,
      dailyLimit: 20,
      suspended: false,
      reconnectRequired: false,
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await prisma.gmailToken.findUnique({
    where: { userId: user.id },
    select: { gmailConnectedAt: true, gmailEmail: true },
  });

  if (!token) {
    return NextResponse.json({
      connected: false,
      gmailEmail: null,
      connectedAt: null,
      dailySent: 0,
      dailyLimit: 5,
      suspended: false,
      reconnectRequired: false,
    });
  }

  // Read daily counter from Redis
  const dailyKey = getDailyKey(user.id);
  const [dailySentRaw, dailyLimit, suspendedFlag, reconnectFlag] =
    await Promise.all([
      gmailRedis.get(dailyKey),
      getDailyLimit(user.id, gmailRedis),
      gmailRedis.get(`gmail:suspended:${user.id}`),
      gmailRedis.get(`gmail:reconnect_required:${user.id}`),
    ]);

  const dailySent = Number(dailySentRaw ?? 0);

  return NextResponse.json({
    connected: true,
    gmailEmail: token.gmailEmail,
    connectedAt: token.gmailConnectedAt.toISOString(),
    dailySent,
    dailyLimit,
    suspended: suspendedFlag === "1",
    reconnectRequired: reconnectFlag === "true",
  });
}
