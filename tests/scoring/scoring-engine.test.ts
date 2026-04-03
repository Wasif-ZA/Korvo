/**
 * @vitest-environment node
 *
 * Tests for the scoring engine pure functions.
 * All functions are deterministic with no side effects.
 */
import { describe, it, expect } from "vitest";
import {
  scoreContact,
  extractSignals,
  scoreTitleMatch,
  scoreSeniority,
} from "@/worker/scoring/scoring-engine";
import type {
  ContactResult,
  CompanyEnrichmentData,
  ScoringSignals,
} from "@/shared/types/agents";

// ---------------------------------------------------------------------------
// scoreTitleMatch
// ---------------------------------------------------------------------------

describe("scoreTitleMatch", () => {
  it("returns high score (25-30) for strong title match", () => {
    const score = scoreTitleMatch(
      "Senior Software Engineer",
      "Software Engineer",
    );
    expect(score).toBeGreaterThanOrEqual(25);
    expect(score).toBeLessThanOrEqual(30);
  });

  it("returns low score (0-5) for unrelated titles", () => {
    const score = scoreTitleMatch("VP of Marketing", "Software Engineer");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(5);
  });

  it("returns partial score (10-24) for related but not exact titles", () => {
    const score = scoreTitleMatch("Frontend Engineer", "Software Engineer");
    expect(score).toBeGreaterThanOrEqual(10);
    expect(score).toBeLessThanOrEqual(24);
  });

  it("returns full score (30) for exact title match", () => {
    const score = scoreTitleMatch("Software Engineer", "Software Engineer");
    expect(score).toBe(30);
  });

  it("is case-insensitive", () => {
    const scoreA = scoreTitleMatch("software engineer", "Software Engineer");
    const scoreB = scoreTitleMatch("Software Engineer", "software engineer");
    expect(scoreA).toBe(scoreB);
  });
});

// ---------------------------------------------------------------------------
// scoreSeniority
// ---------------------------------------------------------------------------

describe("scoreSeniority", () => {
  it("returns 20 for senior IC titles", () => {
    expect(scoreSeniority("Senior Software Engineer")).toBe(20);
    expect(scoreSeniority("Lead Engineer")).toBe(20);
    expect(scoreSeniority("Staff Software Engineer")).toBe(20);
    expect(scoreSeniority("Principal Engineer")).toBe(20);
  });

  it("returns 15 for mid-level IC titles", () => {
    expect(scoreSeniority("Software Engineer")).toBe(15);
  });

  it("returns 10 for junior/entry-level titles", () => {
    expect(scoreSeniority("Junior Developer")).toBe(10);
    expect(scoreSeniority("Associate Software Engineer")).toBe(10);
  });

  it("returns 12 for manager/director titles", () => {
    expect(scoreSeniority("Engineering Manager")).toBe(12);
    expect(scoreSeniority("Director of Engineering")).toBe(12);
  });

  it("returns 5 for executive/C-suite titles", () => {
    expect(scoreSeniority("CEO")).toBe(5);
    expect(scoreSeniority("CTO")).toBe(5);
    expect(scoreSeniority("VP of Engineering")).toBe(5);
    expect(scoreSeniority("Founder")).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// scoreContact
// ---------------------------------------------------------------------------

describe("scoreContact", () => {
  it("returns total as sum of all signals with tone 'direct' (75+)", () => {
    const signals: ScoringSignals = {
      titleMatchScore: 25,
      seniorityScore: 18,
      publicActivityScore: 15,
      emailConfidenceScore: 15,
      hiringSignalScore: 12,
    };
    const result = scoreContact(signals);
    expect(result.total).toBe(85);
    expect(result.tone).toBe("direct");
    expect(result.breakdown).toEqual(signals);
  });

  it("returns tone 'curious' for total in range 45-74", () => {
    const signals: ScoringSignals = {
      titleMatchScore: 15,
      seniorityScore: 10,
      publicActivityScore: 10,
      emailConfidenceScore: 10,
      hiringSignalScore: 10,
    };
    const result = scoreContact(signals);
    expect(result.total).toBe(55);
    expect(result.tone).toBe("curious");
  });

  it("returns tone 'value_driven' for total below 45", () => {
    const signals: ScoringSignals = {
      titleMatchScore: 5,
      seniorityScore: 5,
      publicActivityScore: 5,
      emailConfidenceScore: 5,
      hiringSignalScore: 5,
    };
    const result = scoreContact(signals);
    expect(result.total).toBe(25);
    expect(result.tone).toBe("value_driven");
  });

  it("clamps total to 100 when signals exceed maximum", () => {
    const signals: ScoringSignals = {
      titleMatchScore: 30,
      seniorityScore: 20,
      publicActivityScore: 20,
      emailConfidenceScore: 15,
      hiringSignalScore: 15,
    };
    const result = scoreContact(signals);
    expect(result.total).toBe(100);
    expect(result.tone).toBe("direct");
  });

  it("clamps total to 0 when signals are negative", () => {
    const signals: ScoringSignals = {
      titleMatchScore: -10,
      seniorityScore: -5,
      publicActivityScore: -5,
      emailConfidenceScore: -5,
      hiringSignalScore: -5,
    };
    const result = scoreContact(signals);
    expect(result.total).toBe(0);
    expect(result.tone).toBe("value_driven");
  });

  it("returns tone 'direct' at exactly 75", () => {
    const signals: ScoringSignals = {
      titleMatchScore: 25,
      seniorityScore: 15,
      publicActivityScore: 15,
      emailConfidenceScore: 10,
      hiringSignalScore: 10,
    };
    const result = scoreContact(signals);
    expect(result.total).toBe(75);
    expect(result.tone).toBe("direct");
  });

  it("returns tone 'curious' at exactly 45", () => {
    const signals: ScoringSignals = {
      titleMatchScore: 10,
      seniorityScore: 10,
      publicActivityScore: 10,
      emailConfidenceScore: 10,
      hiringSignalScore: 5,
    };
    const result = scoreContact(signals);
    expect(result.total).toBe(45);
    expect(result.tone).toBe("curious");
  });

  it("includes all 5 signal values in breakdown", () => {
    const signals: ScoringSignals = {
      titleMatchScore: 20,
      seniorityScore: 15,
      publicActivityScore: 10,
      emailConfidenceScore: 10,
      hiringSignalScore: 5,
    };
    const result = scoreContact(signals);
    expect(result.breakdown).toHaveProperty("titleMatchScore");
    expect(result.breakdown).toHaveProperty("seniorityScore");
    expect(result.breakdown).toHaveProperty("publicActivityScore");
    expect(result.breakdown).toHaveProperty("emailConfidenceScore");
    expect(result.breakdown).toHaveProperty("hiringSignalScore");
  });
});

// ---------------------------------------------------------------------------
// extractSignals
// ---------------------------------------------------------------------------

describe("extractSignals", () => {
  const baseContact: ContactResult = {
    name: "Alice Smith",
    title: "Senior Software Engineer",
    sourceUrl: "https://linkedin.com/in/alice",
    confidence: "high",
    publicActivity: "Wrote a blog post about TypeScript",
  };

  const enrichmentWithHiring: CompanyEnrichmentData = {
    techStack: ["TypeScript", "React"],
    recentNews: ["Raised Series B"],
    companyValues: ["Innovation"],
    hiringRoles: ["Software Engineer", "Product Manager"],
    teamSize: "100-200",
    scrapedPages: 3,
  };

  it("sets hiringSignalScore to 15 when enrichment has matching hiringRoles", () => {
    const signals = extractSignals(
      baseContact,
      "Software Engineer",
      enrichmentWithHiring,
    );
    expect(signals.hiringSignalScore).toBe(15);
  });

  it("sets hiringSignalScore to 5 when enrichment is null", () => {
    const signals = extractSignals(baseContact, "Software Engineer", null);
    expect(signals.hiringSignalScore).toBe(5);
  });

  it("sets hiringSignalScore to 5 when no matching role in hiringRoles", () => {
    const enrichmentNoMatch: CompanyEnrichmentData = {
      ...enrichmentWithHiring,
      hiringRoles: ["Product Manager", "Designer"],
    };
    const signals = extractSignals(
      baseContact,
      "Software Engineer",
      enrichmentNoMatch,
    );
    expect(signals.hiringSignalScore).toBe(5);
  });

  it("sets publicActivityScore to 15 when contact has publicActivity", () => {
    const signals = extractSignals(baseContact, "Software Engineer", null);
    expect(signals.publicActivityScore).toBe(15);
  });

  it("sets publicActivityScore to 5 when contact has no publicActivity", () => {
    const contact: ContactResult = { ...baseContact, publicActivity: null };
    const signals = extractSignals(contact, "Software Engineer", null);
    expect(signals.publicActivityScore).toBe(5);
  });

  it("sets emailConfidenceScore to 15 for high confidence", () => {
    const signals = extractSignals(baseContact, "Software Engineer", null);
    expect(signals.emailConfidenceScore).toBe(15);
  });

  it("sets emailConfidenceScore to 10 for medium confidence", () => {
    const contact: ContactResult = { ...baseContact, confidence: "medium" };
    const signals = extractSignals(contact, "Software Engineer", null);
    expect(signals.emailConfidenceScore).toBe(10);
  });

  it("sets emailConfidenceScore to 5 for low confidence", () => {
    const contact: ContactResult = { ...baseContact, confidence: "low" };
    const signals = extractSignals(contact, "Software Engineer", null);
    expect(signals.emailConfidenceScore).toBe(5);
  });

  it("computes titleMatchScore via scoreTitleMatch", () => {
    const signals = extractSignals(baseContact, "Software Engineer", null);
    const expected = scoreTitleMatch(baseContact.title, "Software Engineer");
    expect(signals.titleMatchScore).toBe(expected);
  });

  it("computes seniorityScore via scoreSeniority", () => {
    const signals = extractSignals(baseContact, "Software Engineer", null);
    const expected = scoreSeniority(baseContact.title);
    expect(signals.seniorityScore).toBe(expected);
  });
});
