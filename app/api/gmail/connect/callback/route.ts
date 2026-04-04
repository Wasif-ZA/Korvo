// app/api/gmail/connect/callback/route.ts
// Exchanges OAuth code for tokens, encrypts refresh token, upserts into GmailToken table.
// CSRF protected via gmail_oauth_state cookie (Pitfall 5 from research).
// If refresh_token is null (user re-consented without revoke), redirects to error (Pitfall 1).
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getOAuth2Client } from "@/lib/gmail/oauth-client";
import { encryptToken } from "@/lib/gmail/token-crypto";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Validate CSRF state against cookie (Pitfall 5)
  const storedState = request.cookies.get("gmail_oauth_state")?.value;

  if (!storedState || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/settings?gmail=error", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/settings?gmail=error", request.url));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL("/settings?gmail=error", request.url),
      );
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // If refresh_token is missing, the user must revoke and reconnect (Pitfall 1)
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/settings?gmail=error", request.url),
      );
    }

    // Upsert GmailToken — encrypts refresh token at rest (D-04)
    await prisma.gmailToken.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        encryptedRefreshToken: encryptToken(tokens.refresh_token),
        gmailEmail: null,
        gmailConnectedAt: new Date(),
        firstSentAt: null,
      },
      update: {
        encryptedRefreshToken: encryptToken(tokens.refresh_token),
        gmailConnectedAt: new Date(),
      },
    });

    const response = NextResponse.redirect(
      new URL("/settings?gmail=connected", request.url),
    );

    // Clear the CSRF cookie
    response.cookies.set("gmail_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/settings?gmail=error", request.url));
  }
}
