export function passwordStrengthError(password: string): string | null {
  if (password.length < 10) return 'Password must be at least 10 characters.'
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.'
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must include a number.'
  return null
}

// Supabase's "Leaked Password Protection" is a Pro-plan feature and wraps
// the same public HaveIBeenPwned Pwned Passwords API used here directly.
// The API's k-anonymity design means only a 5-character hash prefix ever
// leaves the browser — never the password or its full hash — so this is
// safe to call client-side, no server round-trip needed.
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password))
    const hash = Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
    if (!res.ok) return false // fail open — never block account creation over a third-party outage
    const body = await res.text()
    return body.split('\n').some(line => line.split(':')[0].trim() === suffix)
  } catch {
    return false // fail open on network errors too
  }
}
