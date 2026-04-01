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
    vi.unstubAllEnvs()
    mockSessionsCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/test_session',
    })
    mockPromotionCodesList.mockResolvedValue({ data: [] })
    // Authenticated user by default
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user_abc', email: 'test@example.com' } },
    })
  })

  // --- Plan name resolution (new behaviors) ---

  it('resolves "monthly" to STRIPE_PRO_MONTHLY_PRICE_ID and proceeds to session creation', async () => {
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_monthly_test_123')
    vi.stubEnv('STRIPE_PRO_ANNUAL_PRICE_ID', 'price_annual_test_456')

    const req = makeRequest({ priceId: 'monthly' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/test_session')

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_monthly_test_123', quantity: 1 }],
      })
    )
  })

  it('resolves "annual" to STRIPE_PRO_ANNUAL_PRICE_ID and proceeds to session creation', async () => {
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_monthly_test_123')
    vi.stubEnv('STRIPE_PRO_ANNUAL_PRICE_ID', 'price_annual_test_456')

    const req = makeRequest({ priceId: 'annual' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/test_session')

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_annual_test_456', quantity: 1 }],
      })
    )
  })

  it('returns 400 with "Invalid plan" for unknown plan name', async () => {
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_monthly_test_123')
    vi.stubEnv('STRIPE_PRO_ANNUAL_PRICE_ID', 'price_annual_test_456')

    const req = makeRequest({ priceId: 'unknown' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalid/i)
  })

  it('returns 500 with "Price not configured" when STRIPE_PRO_MONTHLY_PRICE_ID is missing', async () => {
    // Do not stub STRIPE_PRO_MONTHLY_PRICE_ID — leave it undefined
    vi.stubEnv('STRIPE_PRO_ANNUAL_PRICE_ID', 'price_annual_test_456')

    const req = makeRequest({ priceId: 'monthly' })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/price not configured/i)
  })

  it('passes promo code through to stripe.promotionCodes.list when provided', async () => {
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_monthly_test_123')
    vi.stubEnv('STRIPE_PRO_ANNUAL_PRICE_ID', 'price_annual_test_456')
    mockPromotionCodesList.mockResolvedValueOnce({
      data: [{ id: 'promo_test_123', code: 'UTSBDSOC' }],
    })

    const req = makeRequest({ priceId: 'monthly', promoCode: 'UTSBDSOC' })
    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(mockPromotionCodesList).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'UTSBDSOC', limit: 1 })
    )

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        discounts: [{ promotion_code: 'promo_test_123' }],
      })
    )
    const callArgs = mockSessionsCreate.mock.calls[0][0]
    expect(callArgs).not.toHaveProperty('allow_promotion_codes')
  })

  // --- Existing behaviors preserved ---

  it('returns 401 for unauthenticated users', async () => {
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_monthly_test_123')
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const req = makeRequest({ priceId: 'monthly' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 400 for missing priceId', async () => {
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates checkout session with allow_promotion_codes when no promo code provided', async () => {
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_monthly_test_123')
    vi.stubEnv('STRIPE_PRO_ANNUAL_PRICE_ID', 'price_annual_test_456')

    const req = makeRequest({ priceId: 'monthly' })
    await POST(req)

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        allow_promotion_codes: true,
        mode: 'subscription',
        metadata: { user_id: 'user_abc' },
      })
    )
  })

  it('falls back to allow_promotion_codes if promo code not found in Stripe', async () => {
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_monthly_test_123')
    vi.stubEnv('STRIPE_PRO_ANNUAL_PRICE_ID', 'price_annual_test_456')
    mockPromotionCodesList.mockResolvedValueOnce({ data: [] })

    const req = makeRequest({ priceId: 'annual', promoCode: 'NOTFOUND' })
    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        allow_promotion_codes: true,
      })
    )
  })
})
