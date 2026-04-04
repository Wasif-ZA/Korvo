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
      const createdAt = new Date(data.user.created_at).getTime();
      const lastSignIn = data.user.last_sign_in_at
        ? new Date(data.user.last_sign_in_at).getTime()
        : createdAt;
      const isNewUser = Math.abs(createdAt - lastSignIn) < 5000;

      if (guestSession) {
        await prisma.search.updateMany({
          where: { sessionId: guestSession, userId: null },
          data: { userId: data.user.id },
        });
      }

      const redirectUrl = new URL("/", origin);
      if (isNewUser) {
        redirectUrl.searchParams.set("event", "signup");
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(new URL("/", origin));
}
