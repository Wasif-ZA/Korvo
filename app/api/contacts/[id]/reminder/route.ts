import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { isDemoMode } from "@/lib/demo/guards";

const reminderSchema = z.object({
  reminderActive: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (isDemoMode()) {
    const body = (await req.json().catch(() => ({}))) as {
      reminderActive?: boolean;
    };
    const reminderAt = body.reminderActive
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    return NextResponse.json({ success: true, data: { id, reminderAt } });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reminderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 },
    );
  }

  // Look up the contact with ownership check
  let contact;
  try {
    contact = await prisma.contact.findUniqueOrThrow({
      where: { id },
      include: { search: true },
    });
  } catch {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (contact.search.userId !== user.id) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  let reminderAt: string | null = null;

  if (parsed.data.reminderActive) {
    // Set reminder 7 days from now
    const date = new Date();
    date.setDate(date.getDate() + 7);
    reminderAt = date.toISOString();

    await prisma.contact.update({
      where: { id },
      data: {
        notes: JSON.stringify({ reminder_at: reminderAt }),
      },
    });
  } else {
    // Clear the reminder
    await prisma.contact.update({
      where: { id },
      data: { notes: null },
    });
  }

  return NextResponse.json({
    success: true,
    data: { id, reminderAt },
  });
}
