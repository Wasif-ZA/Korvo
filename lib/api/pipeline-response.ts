import { prisma } from "@/lib/db/prisma";
import type { PipelineResponse } from "@/shared/types/agents";

/**
 * Assembles a full PipelineResponse from the database for a given search ID.
 * Maps DB columns to the shared D-14 interface shape.
 */
export async function assemblePipelineResponse(
  searchId: string,
): Promise<PipelineResponse> {
  const search = await prisma.search.findUniqueOrThrow({
    where: { id: searchId },
    include: {
      contacts: {
        include: {
          outreach: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  return {
    company: search.company,
    role: search.role,
    pipeline_status: mapStatus(search.status),
    contacts: search.contacts.map((c) => ({
      name: c.name,
      title: c.title,
      email: c.email ?? "",
      confidence: mapConfidence(c.emailConfidence),
      hooks: [c.researchMentionThis, c.researchAskThis].filter(
        Boolean,
      ) as string[],
    })),
    steps: buildSteps(search.status),
    drafts: search.contacts.flatMap((c) =>
      c.outreach.map((o) => ({
        contact_name: c.name,
        subject: o.subject,
        body: o.body,
        hook_used: c.researchMentionThis ?? "",
      })),
    ),
  };
}

function mapStatus(status: string): "running" | "complete" | "failed" {
  if (status === "completed") return "complete";
  if (status === "failed") return "failed";
  return "running"; // pending, processing
}

/**
 * Maps DB string confidence to numeric 0-1 range for UI display.
 */
function mapConfidence(confidence: string | null): number {
  if (confidence === "high") return 0.9;
  if (confidence === "medium") return 0.6;
  return 0.3; // low or null
}

/**
 * Builds the 4-step progress array for the frontend tracker.
 */
function buildSteps(status: string): PipelineResponse["steps"] {
  const isComplete = status === "completed";
  const isFailed = status === "failed";

  if (isComplete) {
    return [
      {
        id: "contacts",
        label: "Finding contacts",
        status: "complete",
        detail: "Found 3 contacts",
      },
      {
        id: "emails",
        label: "Guessing emails",
        status: "complete",
        detail: "Email patterns detected",
      },
      {
        id: "hooks",
        label: "Researching hooks",
        status: "complete",
        detail: "Personalization hooks found",
      },
      {
        id: "drafts",
        label: "Drafting emails",
        status: "complete",
        detail: "3 drafts ready",
      },
    ];
  }

  if (isFailed) {
    return [
      {
        id: "contacts",
        label: "Finding contacts",
        status: "failed",
        detail: "Pipeline failed",
      },
      { id: "emails", label: "Guessing emails", status: "failed", detail: "" },
      { id: "hooks", label: "Researching hooks", status: "failed", detail: "" },
      { id: "drafts", label: "Drafting emails", status: "failed", detail: "" },
    ];
  }

  // Running — return current progress (simplified for V1)
  return [
    {
      id: "contacts",
      label: "Finding contacts",
      status: "running",
      detail: "Searching...",
    },
    { id: "emails", label: "Guessing emails", status: "pending", detail: "" },
    { id: "hooks", label: "Researching hooks", status: "pending", detail: "" },
    { id: "drafts", label: "Drafting emails", status: "pending", detail: "" },
  ];
}
