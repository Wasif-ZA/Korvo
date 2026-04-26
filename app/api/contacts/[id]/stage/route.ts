import { NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/guards";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (isDemoMode()) {
    const body = (await request.json().catch(() => ({}))) as {
      stage?: string;
    };
    return NextResponse.json({
      success: true,
      data: { id, stage: body.stage ?? "identified" },
    });
  }

  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 },
  );
}
