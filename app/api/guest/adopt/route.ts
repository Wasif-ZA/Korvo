// Guest data adoption endpoint — backup for edge cases where callback adoption fails
// Requires authentication: only an authenticated user can adopt their own guest searches
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { guestSessionId?: string }
  try {
    body = await req.json() as { guestSessionId?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { guestSessionId } = body

  if (!guestSessionId || typeof guestSessionId !== 'string') {
    return NextResponse.json({ error: 'guestSessionId is required' }, { status: 400 })
  }

  const result = await prisma.search.updateMany({
    where: {
      sessionId: guestSessionId,
      userId: null,
    },
    data: {
      userId: user.id,
    },
  })

  return NextResponse.json({ adopted: result.count })
}
