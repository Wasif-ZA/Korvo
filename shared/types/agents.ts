// Contact Finder output (per contact)
export interface ContactResult {
  name: string;
  title: string;
  sourceUrl: string | null;
  confidence: "high" | "medium" | "low";
  publicActivity: string | null;
}

// Email Guesser output (per contact)
export interface EmailGuess {
  email: string;
  confidence: "high" | "medium" | "low";
  patternSource: string;
}

// Research Agent output (per contact)
export interface ResearchCard {
  background: string;
  askThis: string;
  mentionThis: string;
  hooks: string[];
}

// Email Drafter output (per contact)
export interface DraftResult {
  subject: string;
  body: string;
  templateType: "referral_ask" | "hiring_inquiry" | "value_offer";
  hookUsed: string;
}

// Scoring Engine types
export interface ScoringSignals {
  titleMatchScore: number; // 0-30
  seniorityScore: number; // 0-20
  publicActivityScore: number; // 0-20
  emailConfidenceScore: number; // 0-15
  hiringSignalScore: number; // 0-15
}

export interface ScoreResult {
  total: number; // 0-100
  tone: "direct" | "curious" | "value_driven";
  breakdown: ScoringSignals;
}

// Tone type used by drafter and scoring
export type Tone = "direct" | "curious" | "value_driven";

// Template type (D-13)
export type TemplateType =
  | "referral_ask"
  | "hiring_inquiry"
  | "value_offer"
  | "followup_1"
  | "followup_2";

// Company enrichment data shape (stored as JSON in company_enrichments.data)
export interface CompanyEnrichmentData {
  techStack: string[];
  recentNews: string[];
  companyValues: string[];
  hiringRoles: string[];
  teamSize: string | null;
  scrapedPages: number;
}

// PipelineResponse — the shape the frontend demo expects (D-14)
export interface PipelineResponse {
  company: string;
  role: string;
  pipeline_status: "running" | "complete" | "failed";
  contacts: {
    id: string;
    name: string;
    title: string;
    email: string;
    confidence: number; // 0-1
    score: number; // 0-100 response probability
    scoreBreakdown: ScoringSignals | null;
    hooks: string[];
    researchBackground: string | null;
    researchAskThis: string | null;
    researchMentionThis: string | null;
  }[];
  steps: {
    id: "contacts" | "emails" | "hooks" | "drafts";
    label: string;
    status: "pending" | "running" | "complete" | "failed";
    detail: string;
  }[];
  drafts: {
    id: string;
    contact_name: string;
    subject: string;
    body: string;
    hook_used: string;
  }[];
}
