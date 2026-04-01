import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockSessionsCreate, mockPromotionCodesList, mockGetUser } = vi.hoisted(() => ({
  mockSessionsCreate: vi.fn(),
  mockPromotionCodesList: vi.fn(),
  mockGetUser: vi.fn(),
}))

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: mockSessionsCreate,
      },
    },
    promotionCodes: {
      list: mockPromotionCodesList,
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    })
  ),
}))

// Import after mocks are set up
const { POST } = await import('@/app/api/stripe/checkout/route')

// Helper to create a POST request with JSON body
function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSessionsCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/test_session',
    })
    mockPromotionCodesList.mockResolvedValue({ data: [] })
  })

  it('returns 401 for unauthenticated users', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const req = makeRequest({ priceId: 'price_test_monthly' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 400 for invalid priceId (does not start with price_)', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user_abc', email: 'test@example.com' } },
    })
    const req = makeRequest({ priceId: 'invalid_price_id' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalid/i)
  })

  it('returns 400 for missing priceId', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user_abc', email: 'test@example.com' } },
    })
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns checkout URL for authenticated user with valid priceId', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user_abc', email: 'test@example.com' } },
    })
    const req = makeRequest({ priceId: 'price_test_monthly' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/test_session')
  })

  it('creates checkout session with allow_promotion_codes when no promo code provided', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user_abc', email: 'test@example.com' } },
    })
    const req = makeRequest({ priceId: 'price_test_monthly' })
    await POST(req)

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        allow_promotion_codes: true,
        mode: 'subscription',
        metadata: { user_id: 'user_abc' },
      })
    )
  })

  it('looks up and applies promo code when promoCode is provided', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user_abc', email: 'test@example.com' } },
    })
    mockPromotionCodesList.mockResolvedValueOnce({
      data: [{ id: 'promo_test_123', code: 'UTSBDSOC' }],
    })

    const req = makeRequest({ priceId: 'price_test_monthly', promoCode: 'UTSBDSOC' })
    const res = await POST(req)
    expect(res.status).toBe(200)

    // Promo code looked up
    expect(mockPromotionCodesList).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'UTSBDSOC', limit: 1 })
    )

    // Session created with discounts (not allow_promotion_codes)
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        discounts: [{ promotion_code: 'promo_test_123' }],
      })
    )
    // allow_promotion_codes should NOT be set when promo code is applied directly
    const callArgs = mockSessionsCreate.mock.calls[0][0]
    expect(callArgs).not.toHaveProperty('allow_promotion_codes')
  })

  it('falls back to allow_promotion_codes if promo code not found in Stripe', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user_abc', email: 'test@example.com' } },
    })
    // Empty promo codes list (code not found)
    mockPromotionCodesList.mockResolvedValueOnce({ data: [] })

    const req = makeRequest({ priceId: 'price_test_annual', promoCode: 'NOTFOUND' })
    const res = await POST(req)
    expect(res.status).toBe(200)

    // When promo not found, keep allow_promotion_codes: true
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        allow_promotion_codes: true,
      })
    )
  })
})
