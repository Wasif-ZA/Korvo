import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockConstructEvent, mockSessionsRetrieve, mockProfileUpdate, mockProfileUpdateMany } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockSessionsRetrieve: vi.fn(),
  mockProfileUpdate: vi.fn(() => Promise.resolve({})),
  mockProfileUpdateMany: vi.fn(() => Promise.resolve({ count: 1 })),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    profile: {
      update: mockProfileUpdate,
      updateMany: mockProfileUpdateMany,
    },
  },
}))

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    checkout: {
      sessions: {
        retrieve: mockSessionsRetrieve,
      },
    },
  },
}))

// Import after mocks are set up
const { POST } = await import('@/app/api/stripe/webhooks/route')

// Helper to create a NextRequest with given body and headers
function makeRequest(body: string, signature?: string): NextRequest {
  return new NextRequest('http://localhost/api/stripe/webhooks', {
    method: 'POST',
    body,
    headers: signature ? { 'stripe-signature': signature } : {},
  })
}

describe('POST /api/stripe/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 if stripe-signature header is missing', async () => {
    const req = makeRequest('{}')
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/stripe-signature/i)
  })

  it('returns 400 if signature verification fails', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('Webhook signature verification failed')
    })
    const req = makeRequest('{}', 'bad_signature')
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/signature verification failed/i)
  })

  it('handles checkout.session.completed and updates profile to pro', async () => {
    const fakeSession = {
      id: 'cs_test_123',
      metadata: { user_id: 'user_abc' },
      customer: 'cus_test_123',
      subscription: { id: 'sub_test_123' },
    }
    mockConstructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_123' } },
    })
    mockSessionsRetrieve.mockResolvedValueOnce(fakeSession)

    const req = makeRequest(JSON.stringify({}), 'valid_sig')
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)

    // Verify session retrieved with expand (Pitfall 7 prevention)
    expect(mockSessionsRetrieve).toHaveBeenCalledWith('cs_test_123', {
      expand: ['subscription'],
    })

    // Verify profile updated with plan: 'pro'
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_abc' },
        data: expect.objectContaining({
          plan: 'pro',
          stripeCustomerId: 'cus_test_123',
          stripeSubscriptionId: 'sub_test_123',
        }),
      })
    )
  })

  it('handles customer.subscription.deleted and downgrades to free', async () => {
    const fakeSubscription = { id: 'sub_test_456' }
    mockConstructEvent.mockReturnValueOnce({
      type: 'customer.subscription.deleted',
      data: { object: fakeSubscription },
    })

    const req = makeRequest(JSON.stringify({}), 'valid_sig')
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)

    // Verify profile downgraded to free
    expect(mockProfileUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: 'sub_test_456' },
        data: expect.objectContaining({
          plan: 'free',
          stripeSubscriptionId: null,
        }),
      })
    )
  })

  it('returns 200 for unhandled event types without throwing', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'invoice.payment_succeeded',
      data: { object: {} },
    })

    const req = makeRequest(JSON.stringify({}), 'valid_sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })

  it('skips profile update if user_id is missing from metadata', async () => {
    const fakeSession = {
      id: 'cs_no_meta',
      metadata: {},
      customer: 'cus_no_meta',
      subscription: { id: 'sub_no_meta' },
    }
    mockConstructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_no_meta' } },
    })
    mockSessionsRetrieve.mockResolvedValueOnce(fakeSession)

    const req = makeRequest(JSON.stringify({}), 'valid_sig')
    const res = await POST(req)

    // Still returns 200 (acknowledged) but profile.update is not called
    expect(res.status).toBe(200)
    expect(mockProfileUpdate).not.toHaveBeenCalled()
  })
})
