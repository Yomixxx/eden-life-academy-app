export function passwordStrengthError(password: string): string | null {
  if (password.length < 10) return 'Password must be at least 10 characters.'
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.'
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must include a number.'
  return null
}
