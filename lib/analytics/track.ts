/**
 * Centralized PostHog analytics helper — type-safe event tracking.
 *
 * USAGE PATTERN:
 * - Call `track(event, properties)` from client components only.
 * - This module guards against SSR (no-ops when `window` is undefined).
 *
 * SERVER-SIDE EVENTS (signup, upgrade):
 * - `signup` fires client-side after detecting `?event=signup` in the auth callback redirect URL.
 * - `upgrade` fires client-side when detecting a Stripe `session_id` in the pricing/settings redirect URL.
 * - These events cannot use posthog-js directly (browser SDK only). The auth callback and Stripe webhook
 *   set URL params / database flags that client components read and translate into posthog.capture calls.
 */

import posthog from "posthog-js";

/**
 * All trackable event names (MON-01 requirement).
 * Keep this union type in sync with EventMap below.
 */
export type TrackableEvent =
  | "search_completed"
  | "email_copied"
  | "email_sent"
  | "signup"
  | "upgrade"
  | "pipeline_stage_change";

/**
 * Per-event property contracts.
 * These properties are required for PostHog funnel computation (MON-03).
 */
type EventMap = {
  search_completed: {
    company: string;
    role: string;
    location: string;
    contacts_found: number;
  };
  email_copied: {
    contact_id: string;
    company: string;
  };
  email_sent: {
    contact_id: string;
    company: string;
    method: "gmail" | "mailto";
  };
  signup: {
    provider: "google";
  };
  upgrade: {
    plan: "pro";
    source: string;
  };
  pipeline_stage_change: {
    contact_id: string;
    from_stage: string;
    to_stage: string;
  };
};

/**
 * Type-safe wrapper around posthog.capture.
 * No-ops in SSR environments (typeof window === "undefined").
 */
export function track<E extends TrackableEvent>(
  event: E,
  properties: EventMap[E],
): void {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}
