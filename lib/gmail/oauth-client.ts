// lib/gmail/oauth-client.ts
// OAuth2Client factory for Gmail send scope.
// This is a SEPARATE OAuth flow from Supabase authentication (D-01).
// Supabase handles login; this handles Gmail API authorization.
//
// See: .planning/phases/05-gmail-send-deliverability/05-RESEARCH.md Pattern 1
import { google } from "googleapis";

/**
 * Returns a configured OAuth2Client for the gmail.send scope.
 * The redirect URI points to the Gmail OAuth callback — not the Supabase auth callback.
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/gmail/connect/callback`,
  );
}
