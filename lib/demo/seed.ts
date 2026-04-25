/**
 * Demo mode seed data — static company, contact, and email fixtures
 * Loaded in-memory when NEXT_PUBLIC_DEMO_MODE=true
 */

export const DEMO_COMPANIES = [
  { name: "Canva", domain: "canva.com", role: "Engineering Manager" },
  {
    name: "Atlassian",
    domain: "atlassian.com",
    role: "Senior Software Engineer",
  },
  { name: "Linear", domain: "linear.app", role: "Product Engineer" },
];

export const DEMO_SEARCHES = [
  {
    id: "search-canva-001",
    company: "Canva",
    role: "Engineering Manager",
    status: "completed",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: "search-atlassian-001",
    company: "Atlassian",
    role: "Senior Software Engineer",
    status: "completed",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    id: "search-linear-001",
    company: "Linear",
    role: "Product Engineer",
    status: "completed",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  },
];

export const DEMO_CONTACTS = [
  // Canva contacts
  {
    id: "contact-canva-01",
    searchId: "search-canva-001",
    name: "Sarah Chen",
    title: "Engineering Manager",
    email: "sarah.chen@canva.com",
    emailConfidence: "high",
    score: 87,
    scoreBreakdown: {
      titleRelevance: 90,
      emailConfidence: 95,
      activitySignal: 80,
      companyGrowth: 85,
    },
    researchBackground:
      "Sarah leads the Web Platform team at Canva, focusing on scalability and performance. Active on Twitter discussing engineering practices.",
    researchAskThis:
      "How do you handle scaling challenges with millions of concurrent users?",
    researchMentionThis:
      "Your talk on frontend architecture at ReactConf 2024 was insightful.",
    pipelineStage: "identified",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "contact-canva-02",
    searchId: "search-canva-001",
    name: "Marcus Rodriguez",
    title: "Senior Software Engineer",
    email: "m.rodriguez@canva.com",
    emailConfidence: "high",
    score: 76,
    scoreBreakdown: {
      titleRelevance: 80,
      emailConfidence: 90,
      activitySignal: 75,
      companyGrowth: 75,
    },
    researchBackground:
      "Marcus works on the API infrastructure team and contributes to Canva's engineering blog.",
    researchAskThis:
      "What's your tech stack for handling real-time collaboration?",
    researchMentionThis:
      "Your blog post on system design was shared across the team.",
    pipelineStage: "identified",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "contact-canva-03",
    searchId: "search-canva-001",
    name: "Emma Williams",
    title: "Staff Engineer",
    email: "emma.w@canva.com",
    emailConfidence: "medium",
    score: 64,
    scoreBreakdown: {
      titleRelevance: 70,
      emailConfidence: 75,
      activitySignal: 60,
      companyGrowth: 80,
    },
    researchBackground:
      "Emma mentors junior engineers and leads architecture reviews.",
    researchAskThis: "How do you approach technical mentoring at scale?",
    researchMentionThis:
      "Your GitHub contributions to open-source projects show strong technical depth.",
    pipelineStage: "identified",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  // Atlassian contacts
  {
    id: "contact-atlassian-01",
    searchId: "search-atlassian-001",
    name: "James Park",
    title: "Senior Software Engineer",
    email: "jpark@atlassian.com",
    emailConfidence: "high",
    score: 82,
    scoreBreakdown: {
      titleRelevance: 85,
      emailConfidence: 95,
      activitySignal: 80,
      companyGrowth: 80,
    },
    researchBackground:
      "James leads the Jira Cloud infrastructure team and speaks at engineering conferences.",
    researchAskThis:
      "How do you ensure reliability across distributed microservices?",
    researchMentionThis:
      "Saw your talk at KubeCon about Kubernetes at scale — very relevant.",
    pipelineStage: "identified",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "contact-atlassian-02",
    searchId: "search-atlassian-001",
    name: "Lisa Zhang",
    title: "Senior Software Engineer",
    email: "lzhang@atlassian.com",
    emailConfidence: "high",
    score: 78,
    scoreBreakdown: {
      titleRelevance: 85,
      emailConfidence: 90,
      activitySignal: 75,
      companyGrowth: 75,
    },
    researchBackground:
      "Lisa works on the Confluence team and is active in the frontend community.",
    researchAskThis:
      "What lessons have you learned building large-scale collaboration tools?",
    researchMentionThis:
      "Your Medium article on React patterns is highly cited in our team.",
    pipelineStage: "identified",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "contact-atlassian-03",
    searchId: "search-atlassian-001",
    name: "David Kumar",
    title: "Engineering Manager",
    email: "dkumar@atlassian.com",
    emailConfidence: "medium",
    score: 71,
    scoreBreakdown: {
      titleRelevance: 90,
      emailConfidence: 70,
      activitySignal: 65,
      companyGrowth: 75,
    },
    researchBackground:
      "David manages the platform reliability team and mentors engineers across Atlassian.",
    researchAskThis: "How do you build high-performing engineering teams?",
    researchMentionThis:
      "Your insights on engineering culture align with what we value.",
    pipelineStage: "identified",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  // Linear contacts
  {
    id: "contact-linear-01",
    searchId: "search-linear-001",
    name: "Arjun Patel",
    title: "Product Engineer",
    email: "arjun@linear.app",
    emailConfidence: "high",
    score: 89,
    scoreBreakdown: {
      titleRelevance: 95,
      emailConfidence: 95,
      activitySignal: 88,
      companyGrowth: 85,
    },
    researchBackground:
      "Arjun is a core Linear team member working on the issue tracking engine. Prolific GitHub contributor.",
    researchAskThis:
      "How do you balance shipping fast with maintaining code quality?",
    researchMentionThis:
      "Your open-source projects show exceptional technical quality — exactly what we look for.",
    pipelineStage: "identified",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: "contact-linear-02",
    searchId: "search-linear-001",
    name: "Sofia Bergstrom",
    title: "Product Engineer",
    email: "sofia@linear.app",
    emailConfidence: "high",
    score: 85,
    scoreBreakdown: {
      titleRelevance: 90,
      emailConfidence: 95,
      activitySignal: 85,
      companyGrowth: 80,
    },
    researchBackground:
      "Sofia builds Linear's TypeScript infrastructure and frontend. Known for performance optimization.",
    researchAskThis:
      "How do you approach performance optimization in a web app?",
    researchMentionThis:
      "Your blog posts on React optimization are referenced in our codebase.",
    pipelineStage: "identified",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: "contact-linear-03",
    searchId: "search-linear-001",
    name: "Thomas Mueller",
    title: "Senior Engineer",
    email: "thomas@linear.app",
    emailConfidence: "medium",
    score: 72,
    scoreBreakdown: {
      titleRelevance: 80,
      emailConfidence: 75,
      activitySignal: 70,
      companyGrowth: 80,
    },
    researchBackground:
      "Thomas works on Linear's data layer and database optimization. Active in DevTools community.",
    researchAskThis: "What's your approach to database design at scale?",
    researchMentionThis:
      "Your contributions to the TypeScript ecosystem are impressive.",
    pipelineStage: "identified",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

export const DEMO_OUTREACH = [
  {
    id: "outreach-canva-01",
    contactId: "contact-canva-01",
    templateType: "value_offer",
    subject: "Scaling challenge at Canva — let's chat",
    body: `Hi Sarah,

I've been following your work on Canva's web platform scaling challenges. Your talk at ReactConf really resonated with how we think about frontend performance.

I'm working on a project that tackles similar concurrency issues, and I'd love to get your perspective on our approach. Would you be open to a 15-min call next week?

[Your name]`,
    tone: "curious",
    sentAt: null,
    sentVia: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "outreach-canva-02",
    contactId: "contact-canva-02",
    templateType: "referral_ask",
    subject: "API infrastructure insights",
    body: `Hi Marcus,

Your blog post on system design for real-time collaboration was incredibly helpful to our team. We're solving similar problems and would value your perspective.

Do you have 20 minutes for a quick call? Happy to jump on your calendar.

Best,
[Your name]`,
    tone: "direct",
    sentAt: null,
    sentVia: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "outreach-atlassian-01",
    contactId: "contact-atlassian-01",
    templateType: "value_offer",
    subject: "Kubernetes reliability discussion",
    body: `Hi James,

Your KubeCon talk on Kubernetes at scale was excellent. I'm particularly interested in how you handle the reliability challenges you discussed.

We're working on similar infrastructure challenges and I'd love to share our approach. Available for a quick call this week?

[Your name]`,
    tone: "value_driven",
    sentAt: null,
    sentVia: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
];

// Utility to get demo data for a specific search
export function getDemoContactsForSearch(searchId: string) {
  return DEMO_CONTACTS.filter((c) => c.searchId === searchId);
}

export function getDemoOutreachForContact(contactId: string) {
  return DEMO_OUTREACH.find((o) => o.contactId === contactId);
}
