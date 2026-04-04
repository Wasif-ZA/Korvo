// /api/search — validates input, enforces limits, checks concurrency, and enqueues pipeline jobs
// Per D-01: guest IP limit (3/day), free tier limit (5/month), pro limit (50/month)
// Per D-06: hard block on limit reached, returns limitReached signal to client
// Per D-07/D-08: concurrent active search check before enqueue (one search at a time per user)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { checkAndIncrementSearchLimit, checkGuestIpLimit } from "@/lib/limits";
import { pipelineQueue } from "@/lib/queue/pipeline";

const searchRequestSchema = z.object({
  company: z.string().min(1, "Company is required").max(200),
  role: z.string().min(1, "Role is required").max(200),
  location: z.string().max(200).optional(),
  guestSessionId: z.string().min(1).max(200).optional(),
});

export async function POST(req: NextRequest) {
  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = searchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check auth independently (per D-14: API routes call supabase.auth.getUser() directly)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Authenticated user path — check monthly search limit
    let limitResult;
    try {
      limitResult = await checkAndIncrementSearchLimit(user.id);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "Profile not found") {
        return NextResponse.json(
          { error: "User profile not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to check search limit" },
        { status: 500 },
      );
    }

    if (!limitResult.allowed) {
      return NextResponse.json({
        limitReached: true,
        limitType: "monthly",
        used: limitResult.used,
        limit: limitResult.limit,
        plan: limitResult.plan,
      });
    }

    // D-08: One search at a time per user — check before creating a new search row
    const activeSearch = await prisma.search.findFirst({
      where: { userId: user.id, status: "processing" },
    });
    if (activeSearch) {
      return NextResponse.json({
        limitReached: true,
        limitType: "concurrent",
        message: "A search is already in progress",
      });
    }

    // Create search row with pending status
    const search = await prisma.search.create({
      data: {
        userId: user.id,
        company: parsed.data.company,
        role: parsed.data.role,
        location: parsed.data.location,
        status: "pending",
      },
      select: { id: true },
    });

    // Enqueue pipeline job (ORCH-04)
    const job = await pipelineQueue.add("pipeline", {
      searchId: search.id,
      userId: user.id,
      company: parsed.data.company,
      role: parsed.data.role,
      location: parsed.data.location ?? null,
    });

    return NextResponse.json({
      limitReached: false,
      searchId: search.id,
      jobId: job.id,
    });
  }

  // Guest path — check IP-based daily limit
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  const guestResult = await checkGuestIpLimit(ipAddress);

  if (!guestResult.allowed) {
    return NextResponse.json({
      limitReached: true,
      limitType: "guest",
      used: guestResult.used,
      limit: guestResult.limit,
    });
  }

  // Guest search — create row and enqueue to pipeline
  const search = await prisma.search.create({
    data: {
      sessionId: parsed.data.guestSessionId,
      userId: null,
      company: parsed.data.company,
      role: parsed.data.role,
      location: parsed.data.location,
      status: "pending",
    },
    select: { id: true },
  });

  // Enqueue pipeline job for guest (userId: null — worker handles null userId)
  const job = await pipelineQueue.add("pipeline", {
    searchId: search.id,
    userId: null,
    company: parsed.data.company,
    role: parsed.data.role,
    location: parsed.data.location ?? null,
  });

  return NextResponse.json({
    limitReached: false,
    searchId: search.id,
    jobId: job.id,
  });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await prisma.search.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      _count: {
        select: { contacts: true },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: history.map((h) => ({
      id: h.id,
      company: h.company,
      role: h.role,
      date: h.createdAt,
      contactsCount: h._count.contacts,
    })),
  });
}
