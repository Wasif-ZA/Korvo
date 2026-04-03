import type {
  ScoringSignals,
  ScoreResult,
  ContactResult,
  CompanyEnrichmentData,
  Tone,
} from "@/shared/types/agents";

/**
 * Stop words to exclude when computing keyword overlap.
 * These words appear in many titles and don't contribute to matching signal.
 */
const STOP_WORDS = new Set([
  "of",
  "the",
  "and",
  "at",
  "in",
  "for",
  "a",
  "an",
  "to",
  "with",
  "on",
]);

/**
 * Extracts meaningful keywords from a job title string.
 * Lowercases and removes stop words.
 */
function extractKeywords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(/[\s,/]+/)
      .filter((word) => word.length > 1 && !STOP_WORDS.has(word)),
  );
}

/**
 * Computes a title match score between a contact's title and the target role.
 * Returns a value in range 0-30:
 *   - 30: exact match (all keywords identical)
 *   - 25-29: high overlap (≥ 75% keywords match)
 *   - 10-24: partial overlap (25-74% keywords match)
 *   - 0-5: low/no overlap (< 25% keywords match)
 */
export function scoreTitleMatch(
  contactTitle: string,
  targetRole: string,
): number {
  const contactKeywords = extractKeywords(contactTitle);
  const targetKeywords = extractKeywords(targetRole);

  if (contactKeywords.size === 0 || targetKeywords.size === 0) {
    return 0;
  }

  // Count overlap relative to the target role keywords (what we're looking for)
  let matchCount = 0;
  for (const keyword of targetKeywords) {
    if (contactKeywords.has(keyword)) {
      matchCount++;
    }
  }

  const overlapRatio = matchCount / targetKeywords.size;

  if (overlapRatio >= 1.0) {
    return 30; // Exact match — all target keywords present
  } else if (overlapRatio >= 0.75) {
    return 25; // High match
  } else if (overlapRatio >= 0.5) {
    return 20; // Moderate match
  } else if (overlapRatio >= 0.25) {
    return 10; // Partial match
  } else {
    return 0; // No meaningful overlap
  }
}

/**
 * Maps a contact title to a seniority score.
 * Returns a value in range 0-20 based on the seniority tier:
 *
 * | Tier                    | Score | Rationale                                      |
 * |-------------------------|-------|------------------------------------------------|
 * | Senior/Lead/Staff/Principal IC | 20 | Best cold email targets — skilled, can advocate |
 * | Mid-level IC (default)  | 15    | Good target, may need warm intro                |
 * | Junior/Associate/Intern | 10    | May not have hiring influence                   |
 * | Manager/Director        | 12    | Hiring authority but often gated by screeners  |
 * | VP/C-suite/Founder      |  5    | Too busy — almost never replies to cold email  |
 */
export function scoreSeniority(title: string): number {
  const normalized = title.toLowerCase();

  // Executive / C-suite / Founder — too senior to reply
  if (
    /\b(ceo|cto|coo|cfo|cmo|cpo|founder|co-founder|president|vp |vice president)\b/.test(
      normalized,
    )
  ) {
    return 5;
  }

  // Director and above (non-VP)
  if (/\b(director)\b/.test(normalized)) {
    return 12;
  }

  // Manager
  if (/\b(manager)\b/.test(normalized)) {
    return 12;
  }

  // Senior IC tiers
  if (/\b(senior|lead|staff|principal)\b/.test(normalized)) {
    return 20;
  }

  // Junior / Entry-level
  if (/\b(junior|associate|intern|entry)\b/.test(normalized)) {
    return 10;
  }

  // Default: mid-level IC
  return 15;
}

/**
 * Maps tone thresholds per D-10:
 *   75-100: direct
 *   45-74:  curious
 *   0-44:   value_driven
 */
function mapTone(total: number): Tone {
  if (total >= 75) {
    return "direct";
  } else if (total >= 45) {
    return "curious";
  } else {
    return "value_driven";
  }
}

/**
 * Computes a ScoreResult from pre-computed ScoringSignals.
 * Sums all signals, clamps to [0, 100], and maps tone.
 *
 * Pure function — no side effects, deterministic.
 */
export function scoreContact(signals: ScoringSignals): ScoreResult {
  const raw =
    signals.titleMatchScore +
    signals.seniorityScore +
    signals.publicActivityScore +
    signals.emailConfidenceScore +
    signals.hiringSignalScore;

  const total = Math.min(100, Math.max(0, raw));
  const tone = mapTone(total);

  return {
    total,
    tone,
    breakdown: { ...signals },
  };
}

/**
 * Extracts ScoringSignals from a ContactResult, target role, and optional
 * company enrichment data. Each signal component is computed independently.
 *
 * Signal composition:
 *   - titleMatchScore:     scoreTitleMatch(contact.title, targetRole)
 *   - seniorityScore:      scoreSeniority(contact.title)
 *   - publicActivityScore: 15 if publicActivity exists, else 5
 *   - emailConfidenceScore: high=15, medium=10, low=5
 *   - hiringSignalScore:   15 if enrichment.hiringRoles has partial match, else 5
 */
export function extractSignals(
  contact: ContactResult,
  targetRole: string,
  enrichment: CompanyEnrichmentData | null,
): ScoringSignals {
  const titleMatchScore = scoreTitleMatch(contact.title, targetRole);
  const seniorityScore = scoreSeniority(contact.title);

  const publicActivityScore = contact.publicActivity != null ? 15 : 5;

  const emailConfidenceScoreMap: Record<"high" | "medium" | "low", number> = {
    high: 15,
    medium: 10,
    low: 5,
  };
  const emailConfidenceScore = emailConfidenceScoreMap[contact.confidence];

  const hiringSignalScore = computeHiringSignalScore(enrichment, targetRole);

  return {
    titleMatchScore,
    seniorityScore,
    publicActivityScore,
    emailConfidenceScore,
    hiringSignalScore,
  };
}

/**
 * Returns 15 if any of the enrichment's hiringRoles partially match the
 * target role (case-insensitive keyword overlap). Returns 5 otherwise or
 * if enrichment is null.
 */
function computeHiringSignalScore(
  enrichment: CompanyEnrichmentData | null,
  targetRole: string,
): number {
  if (enrichment == null || enrichment.hiringRoles.length === 0) {
    return 5;
  }

  const targetKeywords = extractKeywords(targetRole);

  for (const hiringRole of enrichment.hiringRoles) {
    const roleKeywords = extractKeywords(hiringRole);
    for (const keyword of targetKeywords) {
      if (roleKeywords.has(keyword)) {
        return 15;
      }
    }
  }

  return 5;
}
