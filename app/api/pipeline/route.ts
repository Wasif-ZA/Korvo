import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/guards";
import { DEMO_CONTACTS, DEMO_SEARCHES } from "@/lib/demo/seed";

export async function GET() {
  if (isDemoMode()) {
    const data = DEMO_CONTACTS.map((c) => ({
      id: c.id,
      name: c.name,
      company:
        DEMO_SEARCHES.find((s) => s.id === c.searchId)?.company ?? "Unknown",
      confidence: c.emailConfidence as "high" | "medium" | "low",
      lastActionAt: c.createdAt.toISOString(),
      stage: c.pipelineStage,
    }));
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: true, data: [] });
}
