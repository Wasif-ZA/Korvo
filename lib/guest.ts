// Guest session management utilities
// Uses localStorage for session ID — survives OAuth redirects via query param handoff
// Per D-01: 3 free searches allowed before requiring signup
// Per D-04: localStorage approach chosen for simplicity and OAuth redirect survival

export const GUEST_SEARCH_LIMIT = 3

// Client-side only — returns null on server
export function getGuestSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('guestSessionId')
}

export function setGuestSessionId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('guestSessionId', id)
}

export function getOrCreateGuestSessionId(): string {
  let id = getGuestSessionId()
  if (!id) {
    id = crypto.randomUUID()
    setGuestSessionId(id)
  }
  return id
}

export function clearGuestSessionId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('guestSessionId')
}

// Track guest search count in localStorage
export function getGuestSearchCount(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem('guestSearchCount') || '0', 10)
}

export function incrementGuestSearchCount(): number {
  const count = getGuestSearchCount() + 1
  localStorage.setItem('guestSearchCount', String(count))
  return count
}

export function clearGuestSearchCount(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('guestSearchCount')
}
