// OAuth callback route handler
// Exchanges OAuth code for session and adopts guest searches into user account
// Per D-02: Guest search data is adopted seamlessly on signup
// Per Pitfall 5: guest_session passed via OAuth redirectTo URL to survive the redirect
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const guestSession = searchParams.get("guest_session");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Detect if this is a new user (created_at == last_sign_in_at within a 5-second window)
      const createdAt = new Date(data.user.created_at).getTime();
      const lastSignIn = data.user.last_sign_in_at
        ? new Date(data.user.last_sign_in_at).getTime()
        : createdAt;
      const isNewUser = Math.abs(createdAt - lastSignIn) < 5000;

      // Adopt guest searches: update all anonymous rows with this session ID to the new user
      if (guestSession) {
        await prisma.search.updateMany({
          where: {
            sessionId: guestSession,
            userId: null,
          },
          data: {
            userId: data.user.id,
          },
        });
      }

      // Pass event=signup as URL param for new users — client component reads and fires posthog event
      const redirectUrl = new URL("/", origin);
      if (isNewUser) {
        redirectUrl.searchParams.set("event", "signup");
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Error or no code — redirect to landing page
  return NextResponse.redirect(new URL("/", origin));
}
