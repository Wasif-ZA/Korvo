// Browser-side Supabase client using @supabase/ssr
// Use in Client Components ('use client')
// Handles cookie-based session automatically in browser context
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
