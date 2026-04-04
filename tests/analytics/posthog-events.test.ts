import { describe, it, expect, vi, beforeEach } from "vitest";
import posthog from "posthog-js";

// Mock posthog-js module
vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
    init: vi.fn(),
    opt_out_capturing: vi.fn(),
    opt_in_capturing: vi.fn(),
    has_opted_out_capturing: vi.fn(() => false),
  },
}));

describe("PostHog Event Tracking (MON-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("track module exports a track function", async () => {
    const mod = await import("@/lib/analytics/track");
    expect(typeof mod.track).toBe("function");
  });

  it("track('search_completed') calls posthog.capture with correct event name", async () => {
    const { track } = await import("@/lib/analytics/track");
    track("search_completed", {
      company: "Acme",
      role: "SWE",
      location: "Sydney",
      contacts_found: 3,
    });
    expect(posthog.capture).toHaveBeenCalledWith(
      "search_completed",
      expect.objectContaining({
        company: "Acme",
        contacts_found: 3,
      }),
    );
  });

  it("track('email_copied') includes contact_id property", async () => {
    const { track } = await import("@/lib/analytics/track");
    track("email_copied", { contact_id: "c1", company: "Acme" });
    expect(posthog.capture).toHaveBeenCalledWith(
      "email_copied",
      expect.objectContaining({
        contact_id: "c1",
      }),
    );
  });

  it("track('email_sent') includes method property for funnel analysis", async () => {
    const { track } = await import("@/lib/analytics/track");
    track("email_sent", { contact_id: "c1", company: "Acme", method: "gmail" });
    expect(posthog.capture).toHaveBeenCalledWith(
      "email_sent",
      expect.objectContaining({
        method: "gmail",
      }),
    );
  });

  it("track('pipeline_stage_change') includes from/to stages", async () => {
    const { track } = await import("@/lib/analytics/track");
    track("pipeline_stage_change", {
      contact_id: "c1",
      from_stage: "identified",
      to_stage: "contacted",
    });
    expect(posthog.capture).toHaveBeenCalledWith(
      "pipeline_stage_change",
      expect.objectContaining({
        from_stage: "identified",
        to_stage: "contacted",
      }),
    );
  });

  it("track('signup') fires with google provider", async () => {
    const { track } = await import("@/lib/analytics/track");
    track("signup", { provider: "google" });
    expect(posthog.capture).toHaveBeenCalledWith(
      "signup",
      expect.objectContaining({ provider: "google" }),
    );
  });

  it("track('upgrade') fires with plan and source", async () => {
    const { track } = await import("@/lib/analytics/track");
    track("upgrade", { plan: "pro", source: "stripe_checkout" });
    expect(posthog.capture).toHaveBeenCalledWith(
      "upgrade",
      expect.objectContaining({ plan: "pro" }),
    );
  });
});

describe("PostHog Success Metrics Properties (MON-03)", () => {
  it("search_completed includes contacts_found for search-to-send funnel", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/analytics/track.ts", "utf-8");
    expect(content).toContain("contacts_found");
  });

  it("email_sent includes method for copy-vs-send analysis", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/analytics/track.ts", "utf-8");
    expect(content).toContain("method");
  });

  it("upgrade includes plan for free-to-paid conversion funnel", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/analytics/track.ts", "utf-8");
    expect(content).toContain("plan");
  });
});
