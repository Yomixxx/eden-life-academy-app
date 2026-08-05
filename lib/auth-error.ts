// Supabase occasionally returns an AuthError whose message is empty or just
// a stringified error body (e.g. "{}") — most often when the Auth API itself
// 500s, such as when a misconfigured custom SMTP provider fails mid-signup.
// Rather than show that raw text, fall back to something a user can read.
export function authErrorMessage(error: { message?: string } | null | undefined, fallback: string): string {
  const message = error?.message?.trim()
  if (!message || !/[a-zA-Z]/.test(message)) return fallback
  return message
}
