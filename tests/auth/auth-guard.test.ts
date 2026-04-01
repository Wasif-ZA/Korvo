// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Control what getUser returns via this ref — changed per test
let mockUserResult: { user: { id: string; email: string } | null } = { user: null }

// Top-level mock — hoisted by Vitest
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: mockUserResult, error: null })
      ),
    },
    // setAll / getAll handled via the cookies object in proxy.ts
  })),
  createBrowserClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  })),
}))

describe('proxy auth guard behavior', () => {
  beforeEach(async () => {
    // Reset to unauthenticated state before each test
    mockUserResult = { user: null }
    vi.resetModules()
  })

  describe('protected routes (/settings, /dashboard) — unauthenticated', () => {
    it('redirects to / when user is null and path is /settings', async () => {
      mockUserResult = { user: null }
      const { proxy } = await import('@/proxy')

      const request = new NextRequest('http://localhost:3000/settings')
      const response = await proxy(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('redirects to / when user is null and path is /dashboard', async () => {
      mockUserResult = { user: null }
      const { proxy } = await import('@/proxy')

      const request = new NextRequest('http://localhost:3000/dashboard')
      const response = await proxy(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('redirects to / for nested protected paths like /settings/profile', async () => {
      mockUserResult = { user: null }
      const { proxy } = await import('@/proxy')

      const request = new NextRequest('http://localhost:3000/settings/profile')
      const response = await proxy(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })
  })

  describe('public routes — unauthenticated', () => {
    it('passes through / when user is null (landing page is public)', async () => {
      mockUserResult = { user: null }
      const { proxy } = await import('@/proxy')

      const request = new NextRequest('http://localhost:3000/')
      const response = await proxy(request)

      // Pass through (NextResponse.next()) — status 200
      expect(response.status).toBe(200)
    })

    it('passes through /pricing when user is null', async () => {
      mockUserResult = { user: null }
      const { proxy } = await import('@/proxy')

      const request = new NextRequest('http://localhost:3000/pricing')
      const response = await proxy(request)

      expect(response.status).toBe(200)
    })

    it('passes through /api/search without auth (API routes self-guard, not proxy)', async () => {
      mockUserResult = { user: null }
      const { proxy } = await import('@/proxy')

      const request = new NextRequest('http://localhost:3000/api/search')
      const response = await proxy(request)

      // proxy.ts does NOT block API routes — they independently call supabase.auth.getUser()
      expect(response.status).toBe(200)
    })
  })

  describe('protected routes — authenticated user', () => {
    it('passes through /settings when user is authenticated', async () => {
      mockUserResult = { user: { id: 'user-123', email: 'test@example.com' } }
      const { proxy } = await import('@/proxy')

      const request = new NextRequest('http://localhost:3000/settings')
      const response = await proxy(request)

      expect(response.status).toBe(200)
    })

    it('passes through /dashboard when user is authenticated', async () => {
      mockUserResult = { user: { id: 'user-123', email: 'test@example.com' } }
      const { proxy } = await import('@/proxy')

      const request = new NextRequest('http://localhost:3000/dashboard')
      const response = await proxy(request)

      expect(response.status).toBe(200)
    })
  })

  describe('config matcher — webhook exclusion', () => {
    it('proxy config matcher string contains api/stripe/webhooks exclusion', async () => {
      // Verify the exported config has the webhook exclusion in the matcher string
      const { config } = await import('@/proxy')
      const matcherString = config.matcher[0]

      // The matcher must exclude the Stripe webhook path
      expect(matcherString).toContain('api/stripe/webhooks')
    })

    it('proxy config matcher string uses negative lookahead pattern', async () => {
      const { config } = await import('@/proxy')
      const matcherString = config.matcher[0]

      // Should be in a negative lookahead: (?!...api/stripe/webhooks...)
      expect(matcherString).toMatch(/\(\?!.*api\/stripe\/webhooks/)
    })

    it('proxy config matcher string excludes _next/static and _next/image', async () => {
      const { config } = await import('@/proxy')
      const matcherString = config.matcher[0]

      expect(matcherString).toContain('_next/static')
      expect(matcherString).toContain('_next/image')
    })
  })
})
