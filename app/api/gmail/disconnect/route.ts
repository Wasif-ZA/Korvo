// app/api/gmail/disconnect/route.ts
// Removes GmailToken from DB and cleans up associated Redis keys.
// Also clears suspension and reconnect-required flags so reconnect starts fresh.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { gmailRedis } from "@/lib/gmail/redis-client";
import { isDemoMode } from "@/lib/demo/guards";

// SettingsView calls this with POST; keep DELETE for the original contract.
export async function POST(_request: NextRequest): Promise<NextResponse> {
  if (isDemoMode()) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE(_request: NextRequest): Promise<NextResponse> {
  if (isDemoMode()) {
    return NextResponse.json({ success: true });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if token exists before attempting delete
  const existing = await prisma.gmailToken.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 404 });
  }

  // Remove DB record
  await prisma.gmailToken.delete({ where: { userId: user.id } });

  // Clean up Redis keys so reconnect starts fresh
  await Promise.all([
    gmailRedis.del(`gmail:warmup:${user.id}:first_sent_at`),
    gmailRedis.del(`gmail:suspended:${user.id}`),
    gmailRedis.del(`gmail:reconnect_required:${user.id}`),
  ]);

  return NextResponse.json({ success: true });
}
