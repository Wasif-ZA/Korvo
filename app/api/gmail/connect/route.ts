// app/api/gmail/connect/route.ts
// Initiates Gmail OAuth flow for Pro users.
// Separate from Supabase login (D-01) — requests gmail.send scope only.
// CRITICAL: prompt:"consent" is mandatory — without it, reconnects won't receive a refresh_token (Pitfall 1)
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getOAuth2Client } from "@/lib/gmail/oauth-client";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Pro users can connect Gmail
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { plan: true },
  });

  if (!profile || profile.plan !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  // Generate CSRF state token
  const state = crypto.randomBytes(32).toString("hex");

  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    // prompt:"consent" is MANDATORY — ensures refresh_token is always returned,
    // even for users who previously connected (Pitfall 1 from research)
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.send"],
    state,
  });

  const response = NextResponse.redirect(authUrl);

  // Store state in httpOnly cookie for CSRF validation in callback
  response.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
