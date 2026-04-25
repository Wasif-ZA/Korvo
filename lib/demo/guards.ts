/**
 * Demo mode guards — inline checks to redirect calls to mocks
 * Used at key integration points: queue, auth, DB reads
 * Minimal changes to main codebase
 */

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * Guard queue.add() calls — in demo, return fake job
 * Usage: if (isDemoMode()) return demoQueueJob(...)
 */
export function isDemoMode() {
  return DEMO_MODE;
}

export function demoQueueJob(data: unknown) {
  return {
    id: `demo-job-${Date.now()}`,
    data,
    progress: 0,
    updateProgress: async () => {},
  };
}

/**
 * Guard Supabase auth.getUser() — in demo, return demo user
 */
export function demoGetUser() {
  return {
    id: "demo-user-001",
    email: "demo@korvo.local",
    aud: "authenticated",
    role: "authenticated",
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: null,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {
      name: "Demo User",
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Guard Prisma search.create() — in demo, return existing search or synthesize
 */
export async function demoCreateSearch(data: {
  company: string;
  role: string;
}) {
  const { DEMO_SEARCHES } = await import("./seed");
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

  return {
    id: `search-demo-${Date.now()}`,
    company: data.company,
    role: data.role,
    status: "completed",
  };
}

/**
 * Guard Prisma contact.findMany() — in demo, return demo contacts
 */
export async function demoFindContacts() {
  const { DEMO_CONTACTS, DEMO_SEARCHES, DEMO_OUTREACH } =
    await import("./seed");

  return DEMO_CONTACTS.map((c) => ({
    id: c.id,
    searchId: c.searchId,
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
    createdAt: c.createdAt,
    search: {
      company:
        DEMO_SEARCHES.find((s) => s.id === c.searchId)?.company || "Unknown",
    },
    outreach: DEMO_OUTREACH.filter((o) => o.contactId === c.id).map((o) => ({
      id: o.id,
      subject: o.subject,
      body: o.body,
      createdAt: o.createdAt,
    })),
  }));
}

/**
 * Simulate async work in demo mode
 */
export async function demoDelay(minMs = 300, maxMs = 800) {
  const ms = Math.random() * (maxMs - minMs) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
