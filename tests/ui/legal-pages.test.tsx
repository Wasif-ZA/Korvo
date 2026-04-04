import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

describe("Privacy Policy (LEGAL-02, LEGAL-04)", () => {
  const content = readFileSync("app/(marketing)/privacy/page.tsx", "utf-8");

  it("should contain APP 1 — collection purposes section", () => {
    expect(content).toContain("Information We Collect");
  });

  it("should contain APP 5 — notification section", () => {
    expect(content).toContain("Notification");
  });

  it("should contain APP 6 — use/disclosure section", () => {
    expect(content).toContain("How We Use");
  });

  it("should contain APP 11 — security section", () => {
    expect(content).toContain("Data Security");
  });

  it("should contain APP 13 — correction section", () => {
    expect(content).toContain("Access and Correction");
  });

  it("should disclose PostHog analytics with opt-out mention (per D-11)", () => {
    expect(content).toContain("PostHog");
    expect(content).toContain("opt");
  });

  it("should disclose Claude AI processing (per D-11)", () => {
    expect(content).toContain("Claude");
  });

  it("should disclose Gmail scope (per D-11)", () => {
    expect(content).toContain("gmail");
  });

  it("should state 90-day retention for contact data (per D-10)", () => {
    expect(content).toContain("90");
  });
});

describe("Terms of Service (LEGAL-03)", () => {
  const content = readFileSync("app/(marketing)/terms/page.tsx", "utf-8");

  it("should contain prohibited conduct section (per D-12)", () => {
    expect(content).toContain("Prohibited Conduct");
  });

  it("should contain account responsibility section (per D-12)", () => {
    expect(content).toContain("Account Responsibility");
  });

  it("should contain Australian jurisdiction (per D-12)", () => {
    expect(content).toContain("Australia");
  });

  it("should state user responsible for outreach (per D-12)", () => {
    expect(content).toContain("responsible");
  });

  it("should prohibit spamming (per D-12)", () => {
    expect(content).toContain("spam");
  });
});

describe("Footer Links", () => {
  const content = readFileSync("components/marketing/Footer.tsx", "utf-8");

  it("should link to /privacy", () => {
    expect(content).toContain("/privacy");
  });

  it("should link to /terms", () => {
    expect(content).toContain("/terms");
  });
});
