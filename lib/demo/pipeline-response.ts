import { DEMO_CONTACTS, DEMO_OUTREACH, DEMO_SEARCHES } from "./seed";

type Confidence = "high" | "medium" | "low";

function mapConfidence(c: string | null | undefined): number {
  if (c === "high") return 0.9;
  if (c === "medium") return 0.6;
  return 0.3;
}

export async function buildDemoPipelineResponse(searchId: string) {
  // Match by seed id first, otherwise fall back for ad-hoc demo searches
  let search = DEMO_SEARCHES.find((s) => s.id === searchId);
  let companyOverride: string | null = null;

  if (!search && searchId.startsWith("search-demo-")) {
    // Format: search-demo-{slug}-{ts} — strip the trailing timestamp and decode
    const withoutPrefix = searchId.slice("search-demo-".length);
    const lastDash = withoutPrefix.lastIndexOf("-");
    const slug =
      lastDash > 0 ? withoutPrefix.slice(0, lastDash) : withoutPrefix;
    if (slug) {
      try {
        companyOverride = decodeURIComponent(slug.replace(/_/g, " "));
      } catch {
        companyOverride = slug;
      }
    }
    // Borrow Linear's contact set so the UI has data to render
    search = DEMO_SEARCHES.find((s) => s.id === "search-linear-001");
  }
  if (!search) return null;

  const contacts = DEMO_CONTACTS.filter((c) => c.searchId === search!.id);
  const displayCompany = companyOverride ?? search.company;

  // Ensure every contact has a draft — synthesize from research hooks when a
  // seed row is missing so the "Draft Email" button always works in the demo.
  const outreach = contacts.map((c) => {
    const existing = DEMO_OUTREACH.find((o) => o.contactId === c.id);
    if (existing && !companyOverride) return existing;
    const hook = c.researchMentionThis ?? "your work";
    return {
      id: existing?.id ?? `outreach-demo-${c.id}`,
      contactId: c.id,
      templateType: "value_offer",
      subject: `Quick question about ${displayCompany}`,
      body: `Hi ${c.name.split(" ")[0]},\n\n${hook} ${c.researchAskThis ? `I'd love to hear how you think about it — ${c.researchAskThis.toLowerCase()}` : "I'd love to learn more about how you approach your craft."}\n\nI'm exploring ${search!.role} roles and your path at ${displayCompany} stood out. Would you have 15 minutes this week for a quick chat?\n\nThanks,\n[Your name]`,
      tone: "curious" as const,
      sentAt: existing?.sentAt ?? null,
      sentVia: existing?.sentVia ?? null,
      createdAt: c.createdAt,
    };
  });

  return {
    company: displayCompany,
    role: search.role,
    pipeline_status: "complete" as const,
    contacts: contacts.map((c) => ({
      id: c.id,
      name: c.name,
      title: c.title,
      email: c.email,
      confidence: mapConfidence(c.emailConfidence as Confidence),
      score: c.score,
      scoreBreakdown: c.scoreBreakdown,
      hooks: [c.researchMentionThis, c.researchAskThis].filter(
        Boolean,
      ) as string[],
      researchBackground: c.researchBackground,
      researchAskThis: c.researchAskThis,
      researchMentionThis: c.researchMentionThis,
    })),
    steps: [
      {
        id: "contacts",
        label: "Finding contacts",
        status: "complete" as const,
        detail: `Found ${contacts.length} contacts`,
      },
      {
        id: "emails",
        label: "Guessing emails",
        status: "complete" as const,
        detail: "Email patterns detected",
      },
      {
        id: "hooks",
        label: "Researching hooks",
        status: "complete" as const,
        detail: "Personalization hooks found",
      },
      {
        id: "drafts",
        label: "Drafting emails",
        status: "complete" as const,
        detail: `${outreach.length} drafts ready`,
      },
    ],
    drafts: outreach.map((o) => {
      const c = contacts.find((x) => x.id === o.contactId)!;
      return {
        id: o.id,
        contact_id: c.id,
        contact_name: c.name,
        subject: o.subject,
        body: o.body,
        hook_used: c.researchMentionThis ?? "",
      };
    }),
    createdAt: search.createdAt,
  };
}
