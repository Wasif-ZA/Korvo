import { NextRequest, NextResponse } from "next/server";
import { assemblePipelineResponse } from "@/lib/api/pipeline-response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/search/[id]
 * Returns full PipelineResponse for a search.
 * Polled by frontend results page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth check — guests can access search results; future versions enforce ownership
  const supabase = await createSupabaseServerClient();
  await supabase.auth.getUser();

  try {
    const response = await assemblePipelineResponse(id);
    return NextResponse.json({ success: true, data: response });
  } catch (err) {
    // Prisma error code for record not found
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Search not found" },
        { status: 404 },
      );
    }

    console.error(`[api] GET /api/search/${id} failed:`, err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve search results" },
      { status: 500 },
    );
  }
}
