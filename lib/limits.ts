// Server-side rate limiting for guest IP and authenticated user monthly search limits
// Per AUTH-05: enforced server-side, cannot be bypassed client-side
// Per D-12: calendar month reset for monthly counters

import { prisma } from '@/lib/db/prisma'

export const FREE_SEARCH_LIMIT = 5
export const PRO_SEARCH_LIMIT = 50
export const FREE_DRAFT_LIMIT = 5
export const GUEST_IP_DAILY_LIMIT = 3

export type LimitCheckResult = {
  allowed: boolean
  used: number
  limit: number
  plan: string
}

/**
 * Check and increment the monthly search counter for an authenticated user.
 * Handles calendar month reset (D-12) inline.
 * Per AUTH-05: enforced server-side, cannot be bypassed client-side.
 * Per D-06: hard block — no new searches until next month or upgrade.
 */
export async function checkAndIncrementSearchLimit(userId: string): Promise<LimitCheckResult> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      plan: true,
      searchesUsedThisMonth: true,
      searchesResetAt: true,
    },
  })

  if (!profile) throw new Error('Profile not found')

  const now = new Date()
  const resetAt = new Date(profile.searchesResetAt)
  const isNewMonth =
    now.getMonth() !== resetAt.getMonth() ||
    now.getFullYear() !== resetAt.getFullYear()

  const searchesUsed = isNewMonth ? 0 : profile.searchesUsedThisMonth
  const limit = profile.plan === 'pro' ? PRO_SEARCH_LIMIT : FREE_SEARCH_LIMIT

  if (searchesUsed >= limit) {
    return { allowed: false, used: searchesUsed, limit, plan: profile.plan }
  }

  // Increment atomically
  await prisma.profile.update({
    where: { userId },
    data: {
      searchesUsedThisMonth: searchesUsed + 1,
      ...(isNewMonth ? { searchesResetAt: now } : {}),
    },
  })

  return { allowed: true, used: searchesUsed + 1, limit, plan: profile.plan }
}

/**
 * Check guest IP rate limit.
 * Per D-01: 3 free searches allowed per IP per day before requiring signup.
 * Stored in guest_ip_limits table (Open Question 2 resolution).
 */
export async function checkGuestIpLimit(ipAddress: string): Promise<LimitCheckResult> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.guestIpLimit.findFirst({
    where: { ipAddress, date: today },
  })

  if (existing && existing.searchCount >= GUEST_IP_DAILY_LIMIT) {
    return {
      allowed: false,
      used: existing.searchCount,
      limit: GUEST_IP_DAILY_LIMIT,
      plan: 'guest',
    }
  }

  if (existing) {
    await prisma.guestIpLimit.update({
      where: { id: existing.id },
      data: { searchCount: existing.searchCount + 1 },
    })
    return {
      allowed: true,
      used: existing.searchCount + 1,
      limit: GUEST_IP_DAILY_LIMIT,
      plan: 'guest',
    }
  }

  await prisma.guestIpLimit.create({
    data: { ipAddress, searchCount: 1, date: today },
  })
  return { allowed: true, used: 1, limit: GUEST_IP_DAILY_LIMIT, plan: 'guest' }
}
