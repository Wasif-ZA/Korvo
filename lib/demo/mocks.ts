/**
 * Demo mode mocks for external service calls
 * When NEXT_PUBLIC_DEMO_MODE=true, these replace real API calls with seed data
 * Simulates realistic delays (300-800ms) to feel natural in UI
 */

import {
  DEMO_COMPANIES,
  DEMO_CONTACTS,
  DEMO_OUTREACH,
  DEMO_SEARCHES,
  getDemoContactsForSearch,
} from "./seed";
import contactFinderFixture from "./fixtures/contact-finder.json";
import emailGuesserFixture from "./fixtures/email-guesser.json";
import researchFixture from "./fixtures/research.json";
import drafterFixture from "./fixtures/drafter.json";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Utility: simulate network delay
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(minMs = 300, maxMs = 800) {
  return delay(Math.random() * (maxMs - minMs) + minMs);
}

/**
 * Mock Supabase auth.getUser() — returns a demo user for authenticated routes
 */
export async function mockSupabaseGetUser() {
  if (!DEMO_MODE) return null;

  await randomDelay();
  return {
    id: "demo-user-001",
    email: "demo@korvo.local",
    user_metadata: {
      name: "Demo User",
    },
  };
}

/**
 * Mock Prisma search.create() — logs to DB but returns seed search
 */
export async function mockPrismaSearchCreate(data: {
  userId?: string;
  company: string;
  role: string;
  location?: string;
  status?: string;
}) {
  if (!DEMO_MODE) return null;

  await randomDelay();

  // Find matching company in demo data
  const companyLower = data.company.toLowerCase();
  const demoSearch = DEMO_SEARCHES.find((s) =>
    s.company.toLowerCase().includes(companyLower),
  );

  if (demoSearch) {
    return {
      id: demoSearch.id,
      company: data.company,
      role: data.role,
      status: demoSearch.status,
    };
  }

  // Fallback: synthesize a new search
  return {
    id: `search-demo-${Date.now()}`,
    company: data.company,
    role: data.role,
    status: "completed",
  };
}

/**
 * Mock Claude Contact Finder agent
 * Returns 3 contacts for the given company
 */
export async function mockContactFinder(
  company: string,
  _role: string,
  _location?: string,
) {
  if (!DEMO_MODE) return null;

  await randomDelay();

  const companyLower = company.toLowerCase();
  let key: keyof typeof contactFinderFixture = "canva";

  if (companyLower.includes("canva")) key = "canva";
  else if (companyLower.includes("atlassian")) key = "atlassian";
  else if (companyLower.includes("linear")) key = "linear";

  return (contactFinderFixture[key] || contactFinderFixture.canva).map((c) => ({
    name: c.name,
    title: c.title,
    sourceUrl: c.source_url,
    confidence: c.confidence,
    publicActivity: c.public_activity,
  }));
}

/**
 * Mock Claude Email Guesser agent
 * Returns email addresses and confidence levels
 */
export async function mockEmailGuesser(
  _contacts: unknown[],
  _domain: string,
  company?: string,
) {
  if (!DEMO_MODE) return null;

  await randomDelay();

  const companyLower = (company || "canva").toLowerCase();
  let key: keyof typeof emailGuesserFixture = "canva";

  if (companyLower.includes("atlassian")) key = "atlassian";
  else if (companyLower.includes("linear")) key = "linear";

  return (emailGuesserFixture[key] || emailGuesserFixture.canva).map((e) => ({
    email: e.email,
    confidence: e.confidence,
  }));
}

/**
 * Mock Claude Research agent
 * Returns background, ask, mention hooks
 */
export async function mockResearchAgent(
  _contacts: unknown[],
  company: string,
  _domain: string,
) {
  if (!DEMO_MODE) return null;

  await randomDelay();

  const companyLower = company.toLowerCase();
  let key: keyof typeof researchFixture = "canva";

  if (companyLower.includes("atlassian")) key = "atlassian";
  else if (companyLower.includes("linear")) key = "linear";

  return (researchFixture[key] || researchFixture.canva).map((r) => ({
    background: r.background,
    askThis: r.askThis,
    mentionThis: r.mentionThis,
  }));
}

/**
 * Mock Claude Email Drafter agent
 * Returns draft emails
 */
export async function mockEmailDrafter(
  _contacts: unknown[],
  _contactIndices: number[],
  company: string,
  _role: string,
  research: unknown[],
) {
  if (!DEMO_MODE) return null;

  await randomDelay();

  const companyLower = company.toLowerCase();
  let companyPrefix = "canva";

  if (companyLower.includes("atlassian")) companyPrefix = "atlassian";
  else if (companyLower.includes("linear")) companyPrefix = "linear";

  // Return drafted emails matching the research order
  const results = [];
  for (let i = 0; i < research.length; i++) {
    const key = `${companyPrefix}-0${i + 1}` as keyof typeof drafterFixture;
    const draft = drafterFixture[key];
    if (draft) {
      results.push({
        subject: draft.subject,
        body: draft.body,
        tone: i % 3 === 0 ? "curious" : i % 3 === 1 ? "direct" : "value_driven",
      });
    }
  }
  return results;
}

/**
 * Mock Prisma contact.findMany() — returns demo contacts for user
 */
export async function mockPrismaContactsFindMany() {
  if (!DEMO_MODE) return null;

  await randomDelay();

  return DEMO_CONTACTS.map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    email: c.email,
    emailConfidence: c.emailConfidence,
    score: c.score,
    scoreBreakdown: c.scoreBreakdown,
    researchBackground: c.researchBackground,
    researchAskThis: c.researchAskThis,
    researchMentionThis: c.researchMentionThis,
    pipelineStage: c.pipelineStage,
    search: {
      company:
        DEMO_SEARCHES.find((s) => s.id === c.searchId)?.company || "Unknown",
    },
    outreach:
      DEMO_OUTREACH.filter((o) => o.contactId === c.id).map((o) => ({
        id: o.id,
        subject: o.subject,
        body: o.body,
      })) || [],
  }));
}

/**
 * Mock BullMQ job enqueue
 * In demo mode, synchronously run handlers instead of queuing
 */
export async function mockPipelineQueueAdd(
  jobName: string,
  jobData: unknown,
  _options?: unknown,
) {
  if (!DEMO_MODE) return null;

  await randomDelay(500, 1200); // Simulate queue latency

  // Return a fake job object that looks like a real BullMQ job
  return {
    id: `demo-job-${Date.now()}`,
    name: jobName,
    data: jobData,
    progress: 0,
    updateProgress: async () => {},
  };
}

/**
 * Mock Gmail send
 * In demo mode, just return success without sending
 */
export async function mockGmailSend(_message: unknown, _options?: unknown) {
  if (!DEMO_MODE) return null;

  await randomDelay(200, 400);
  return {
    success: true,
    messageId: `<demo-message-${Date.now()}@korvo.local>`,
  };
}

/**
 * Mock Stripe payment
 * In demo mode, always return Pro tier
 */
export async function mockGetUserPlan(_userId: string) {
  if (!DEMO_MODE) return null;

  await randomDelay(100, 200);
  return {
    plan: "pro",
    searchesRemaining: 999,
    draftsRemaining: 999,
  };
}

/**
 * Mock Prisma search status update
 * In demo mode, just log and return
 */
export async function mockPrismaSearchUpdate(
  searchId: string,
  data: Record<string, unknown>,
) {
  if (!DEMO_MODE) return null;

  // Simulate DB update
  await randomDelay();
  return {
    id: searchId,
    ...data,
  };
}

/**
 * Guard function: wrap any async function to use mocks in demo mode
 * Usage: guard('mockFunctionName')(realFunction, arg1, arg2)
 */
export function guard<T extends (...args: unknown[]) => Promise<unknown>>(
  mockFnName: keyof typeof mockFunctionMap,
) {
  return async (realFn: T, ...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!DEMO_MODE) {
      return realFn(...args) as ReturnType<T>;
    }

    const mockFn = mockFunctionMap[mockFnName] as unknown as (
      ...args: unknown[]
    ) => Promise<unknown>;
    if (!mockFn) {
      console.warn(
        `[demo] No mock found for ${mockFnName}, calling real function`,
      );
      return realFn(...args) as ReturnType<T>;
    }

    const result = await mockFn(...args);
    if (result === null) {
      // Mock returned null, fall back to real function
      return realFn(...args) as ReturnType<T>;
    }
    return result as ReturnType<T>;
  };
}

// Export all mocks in a map for easy lookup
export const mockFunctionMap = {
  mockSupabaseGetUser,
  mockPrismaSearchCreate,
  mockContactFinder,
  mockEmailGuesser,
  mockResearchAgent,
  mockEmailDrafter,
  mockPrismaContactsFindMany,
  mockPipelineQueueAdd,
  mockGmailSend,
  mockGetUserPlan,
  mockPrismaSearchUpdate,
};

export default {
  isEnabled: DEMO_MODE,
  guard,
  ...mockFunctionMap,
};
