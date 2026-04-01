// Tests for server-side rate limiting
// Per AUTH-05: free tier = 5 searches/month, pro tier = 50 searches/month
// Per D-12: calendar month reset

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  checkAndIncrementSearchLimit,
  checkGuestIpLimit,
  FREE_SEARCH_LIMIT,
  PRO_SEARCH_LIMIT,
  GUEST_IP_DAILY_LIMIT,
} from '@/lib/limits'

// Mock prisma
vi.mock('@/lib/db/prisma', () => {
  const profile = {
    findUnique: vi.fn(),
    update: vi.fn(),
  }
  const guestIpLimit = {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  }
  return {
    prisma: { profile, guestIpLimit },
  }
})

import { prisma } from '@/lib/db/prisma'

describe('constants', () => {
  it('FREE_SEARCH_LIMIT is 5', () => {
    expect(FREE_SEARCH_LIMIT).toBe(5)
  })

  it('PRO_SEARCH_LIMIT is 50', () => {
    expect(PRO_SEARCH_LIMIT).toBe(50)
  })

  it('GUEST_IP_DAILY_LIMIT is 3', () => {
    expect(GUEST_IP_DAILY_LIMIT).toBe(3)
  })
})

describe('checkAndIncrementSearchLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows a free user with 0 searches and increments to 1', async () => {
    const resetAt = new Date()
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      plan: 'free',
      searchesUsedThisMonth: 0,
      searchesResetAt: resetAt,
    } as never)
    vi.mocked(prisma.profile.update).mockResolvedValue({} as never)

    const result = await checkAndIncrementSearchLimit('user-1')

    expect(result.allowed).toBe(true)
    expect(result.used).toBe(1)
    expect(result.limit).toBe(FREE_SEARCH_LIMIT)
    expect(result.plan).toBe('free')
    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { searchesUsedThisMonth: 1 },
    })
  })

  it('allows a free user with 4 searches and increments to 5', async () => {
    const resetAt = new Date()
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      plan: 'free',
      searchesUsedThisMonth: 4,
      searchesResetAt: resetAt,
    } as never)
    vi.mocked(prisma.profile.update).mockResolvedValue({} as never)

    const result = await checkAndIncrementSearchLimit('user-1')

    expect(result.allowed).toBe(true)
    expect(result.used).toBe(5)
    expect(result.limit).toBe(FREE_SEARCH_LIMIT)
  })

  it('blocks a free user with 5 searches (at limit)', async () => {
    const resetAt = new Date()
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      plan: 'free',
      searchesUsedThisMonth: 5,
      searchesResetAt: resetAt,
    } as never)

    const result = await checkAndIncrementSearchLimit('user-1')

    expect(result.allowed).toBe(false)
    expect(result.used).toBe(5)
    expect(result.limit).toBe(FREE_SEARCH_LIMIT)
    expect(prisma.profile.update).not.toHaveBeenCalled()
  })

  it('allows a pro user with 49 searches and increments to 50', async () => {
    const resetAt = new Date()
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      plan: 'pro',
      searchesUsedThisMonth: 49,
      searchesResetAt: resetAt,
    } as never)
    vi.mocked(prisma.profile.update).mockResolvedValue({} as never)

    const result = await checkAndIncrementSearchLimit('user-2')

    expect(result.allowed).toBe(true)
    expect(result.used).toBe(50)
    expect(result.limit).toBe(PRO_SEARCH_LIMIT)
    expect(result.plan).toBe('pro')
  })

  it('blocks a pro user with 50 searches (at limit)', async () => {
    const resetAt = new Date()
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      plan: 'pro',
      searchesUsedThisMonth: 50,
      searchesResetAt: resetAt,
    } as never)

    const result = await checkAndIncrementSearchLimit('user-2')

    expect(result.allowed).toBe(false)
    expect(result.used).toBe(50)
    expect(result.limit).toBe(PRO_SEARCH_LIMIT)
    expect(prisma.profile.update).not.toHaveBeenCalled()
  })

  it('resets counter on month boundary and allows search', async () => {
    // searchesResetAt is from last month
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      plan: 'free',
      searchesUsedThisMonth: 5, // at limit from last month
      searchesResetAt: lastMonth,
    } as never)
    vi.mocked(prisma.profile.update).mockResolvedValue({} as never)

    const result = await checkAndIncrementSearchLimit('user-1')

    expect(result.allowed).toBe(true)
    expect(result.used).toBe(1) // reset to 0, then incremented
    // Verify searchesResetAt was updated
    const updateCall = vi.mocked(prisma.profile.update).mock.calls[0]
    expect(updateCall[0].data.searchesResetAt).toBeInstanceOf(Date)
  })

  it('throws an error if profile is not found', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null)

    await expect(checkAndIncrementSearchLimit('missing-user')).rejects.toThrow(
      'Profile not found'
    )
  })
})

describe('checkGuestIpLimit', () => {
  const TODAY = new Date()
  TODAY.setHours(0, 0, 0, 0)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows a new IP and creates a record with count 1', async () => {
    vi.mocked(prisma.guestIpLimit.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.guestIpLimit.create).mockResolvedValue({} as never)

    const result = await checkGuestIpLimit('1.2.3.4')

    expect(result.allowed).toBe(true)
    expect(result.used).toBe(1)
    expect(result.limit).toBe(GUEST_IP_DAILY_LIMIT)
    expect(result.plan).toBe('guest')
    expect(prisma.guestIpLimit.create).toHaveBeenCalled()
  })

  it('allows an IP with 2 searches today and increments to 3', async () => {
    vi.mocked(prisma.guestIpLimit.findFirst).mockResolvedValue({
      id: 'gl-1',
      ipAddress: '1.2.3.4',
      searchCount: 2,
      date: TODAY,
    } as never)
    vi.mocked(prisma.guestIpLimit.update).mockResolvedValue({} as never)

    const result = await checkGuestIpLimit('1.2.3.4')

    expect(result.allowed).toBe(true)
    expect(result.used).toBe(3)
    expect(result.limit).toBe(GUEST_IP_DAILY_LIMIT)
    expect(prisma.guestIpLimit.update).toHaveBeenCalledWith({
      where: { id: 'gl-1' },
      data: { searchCount: 3 },
    })
  })

  it('blocks an IP with 3 searches today (at daily limit)', async () => {
    vi.mocked(prisma.guestIpLimit.findFirst).mockResolvedValue({
      id: 'gl-1',
      ipAddress: '1.2.3.4',
      searchCount: 3,
      date: TODAY,
    } as never)

    const result = await checkGuestIpLimit('1.2.3.4')

    expect(result.allowed).toBe(false)
    expect(result.used).toBe(3)
    expect(result.limit).toBe(GUEST_IP_DAILY_LIMIT)
    expect(prisma.guestIpLimit.update).not.toHaveBeenCalled()
    expect(prisma.guestIpLimit.create).not.toHaveBeenCalled()
  })
})
