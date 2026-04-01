// /api/me — Returns profile data for the NavBar
// Per D-14/FOUND-04: reads display data from profiles table, NEVER from JWT user_metadata
// Used by NavBar client component to show avatar + name without exposing sensitive data

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      fullName: true,
      avatarUrl: true,
      plan: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    plan: profile.plan,
  });
}
