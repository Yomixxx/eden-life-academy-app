// Env values pasted into Vercel from a PowerShell pipe arrive with a UTF-8
// Byte Order Mark (U+FEFF / char code 65279) glued to the front; a .env file
// saved on Windows can also leave a stray CR. Any of that in a value that
// ends up in an HTTP header - the Supabase `apikey`, a Resend or Groq bearer
// token - makes fetch throw "Cannot convert argument to a ByteString because
// the character at index 0 has a value of 65279 which is greater than 255".
// Strip the BOM, zero-width characters, NBSP and control characters wherever
// they sit in the string, not just at the ends.
const INVISIBLE = /[\uFEFF\u200B-\u200D\u2060\u00A0\u0000-\u001F\u007F]/g

export function cleanEnv(val?: string | null): string {
  if (!val) return ''
  return val.replace(INVISIBLE, '').trim()
}
