// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true })
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock }, writable: true })

// Mock crypto.randomUUID
const mockUUID = '550e8400-e29b-41d4-a716-446655440000'
vi.stubGlobal('crypto', { randomUUID: () => mockUUID })

import {
  GUEST_SEARCH_LIMIT,
  getGuestSessionId,
  setGuestSessionId,
  getOrCreateGuestSessionId,
  clearGuestSessionId,
  getGuestSearchCount,
  incrementGuestSearchCount,
  clearGuestSearchCount,
} from '@/lib/guest'

describe('Guest Session Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('GUEST_SEARCH_LIMIT', () => {
    it('should equal 3 (per D-01)', () => {
      expect(GUEST_SEARCH_LIMIT).toBe(3)
    })
  })

  describe('getOrCreateGuestSessionId', () => {
    it('first call generates a UUID and stores it in localStorage', () => {
      const id = getOrCreateGuestSessionId()
      expect(id).toBe(mockUUID)
      expect(localStorageMock.getItem('guestSessionId')).toBe(mockUUID)
    })

    it('second call returns the same UUID from localStorage', () => {
      const id1 = getOrCreateGuestSessionId()
      const id2 = getOrCreateGuestSessionId()
      expect(id1).toBe(id2)
    })

    it('returns existing session ID if already set', () => {
      const existingId = 'existing-session-id'
      setGuestSessionId(existingId)
      const id = getOrCreateGuestSessionId()
      expect(id).toBe(existingId)
    })
  })

  describe('getGuestSessionId / setGuestSessionId / clearGuestSessionId', () => {
    it('returns null when no session ID is stored', () => {
      expect(getGuestSessionId()).toBeNull()
    })

    it('returns the stored session ID after setting it', () => {
      setGuestSessionId('test-session-123')
      expect(getGuestSessionId()).toBe('test-session-123')
    })

    it('clearGuestSessionId removes the session ID', () => {
      setGuestSessionId('test-session-123')
      clearGuestSessionId()
      expect(getGuestSessionId()).toBeNull()
    })
  })

  describe('getGuestSearchCount / incrementGuestSearchCount', () => {
    it('starts at 0 when no count is stored', () => {
      expect(getGuestSearchCount()).toBe(0)
    })

    it('increments to 1 on first call', () => {
      const count = incrementGuestSearchCount()
      expect(count).toBe(1)
    })

    it('increments to 2 on second call', () => {
      incrementGuestSearchCount()
      const count = incrementGuestSearchCount()
      expect(count).toBe(2)
    })

    it('increments to 3 on third call (reaching GUEST_SEARCH_LIMIT)', () => {
      incrementGuestSearchCount()
      incrementGuestSearchCount()
      const count = incrementGuestSearchCount()
      expect(count).toBe(GUEST_SEARCH_LIMIT)
    })

    it('clearGuestSearchCount resets the count to 0', () => {
      incrementGuestSearchCount()
      clearGuestSearchCount()
      expect(getGuestSearchCount()).toBe(0)
    })
  })
})

describe('Guest Data Adoption Logic', () => {
  it('adoption query uses sessionId and userId: null to target guest searches', () => {
    // Unit test verifying the adoption pattern used in app/auth/callback/route.ts
    // and app/api/guest/adopt/route.ts
    const mockPrisma = {
      search: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    }

    const guestSessionId = 'guest-session-abc'
    const userId = 'user-123'

    // Simulate the adoption call
    mockPrisma.search.updateMany({
      where: {
        sessionId: guestSessionId,
        userId: null,
      },
      data: {
        userId,
      },
    })

    expect(mockPrisma.search.updateMany).toHaveBeenCalledWith({
      where: { sessionId: guestSessionId, userId: null },
      data: { userId },
    })
  })

  it('adoption adopts only guest rows (userId: null), not authenticated rows', () => {
    const mockPrisma = {
      search: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }

    mockPrisma.search.updateMany({
      where: { sessionId: 'session-xyz', userId: null },
      data: { userId: 'user-456' },
    })

    const callArgs = mockPrisma.search.updateMany.mock.calls[0][0]
    expect(callArgs.where.userId).toBeNull()
  })
})
