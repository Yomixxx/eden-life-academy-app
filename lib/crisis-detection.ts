// Keyword-based detection for crisis-level messages sent to Ask PG.
// Deliberately conservative pattern matching (not an LLM judgment call) so the
// escalation path fires reliably even if the free upstream AI is down.

export type CrisisCategory = 'self_harm' | 'abuse' | 'severe_distress'

const PATTERNS: { category: CrisisCategory; regexes: RegExp[] }[] = [
  {
    category: 'self_harm',
    regexes: [
      /\bsuicid\w*/i,
      /\bkill(ing)? myself\b/i,
      /\bend(ing)? (my|this) life\b/i,
      /\bwant(ed)? to die\b/i,
      /\bdon'?t want to (live|be alive)\b/i,
      /\bno reason to live\b/i,
      /\bself[- ]?harm(ing)?\b/i,
      /\b(cutting|hurting) myself\b/i,
      /\bbetter off dead\b/i,
      /\bkms\b/i,
    ],
  },
  {
    category: 'abuse',
    regexes: [
      /\b(he|she|they|my (husband|wife|partner|father|mother|dad|mum|boyfriend|girlfriend)) (hits|beats|abuses) me\b/i,
      /\bbeing abused\b/i,
      /\bdomestic violence\b/i,
      /\bmolest\w*/i,
      /\brape[ds]?\b/i,
      /\bsexual(ly)? abus\w*/i,
      /\bbeing (beaten|assaulted)\b/i,
    ],
  },
  {
    category: 'severe_distress',
    regexes: [
      /\bwant to give up\b/i,
      /\bcan'?t (go on|take (it|this) anymore)\b/i,
      /\bfeel(ing)? hopeless\b/i,
      /\bnobody would (miss|care about) me\b/i,
    ],
  },
]

export function detectCrisis(text: string): CrisisCategory | null {
  for (const { category, regexes } of PATTERNS) {
    if (regexes.some(r => r.test(text))) return category
  }
  return null
}

const CATEGORY_LABEL: Record<CrisisCategory, string> = {
  self_harm: 'Self-harm / suicidal ideation',
  abuse: 'Abuse disclosure',
  severe_distress: 'Severe distress',
}

export function crisisCategoryLabel(category: CrisisCategory): string {
  return CATEGORY_LABEL[category]
}

// Hard-coded response — never AI-generated — so it stays reliable and correct
// regardless of what the upstream model would have said.
export function crisisResponse(): string {
  return `I hear you, and I am glad you told me. What you are carrying is real, and you should not carry it alone.

I am Ask PG, an AI assistant, not Pastor Gbenga Ajibola himself. But I have flagged this conversation so a real member of our pastoral team is notified and can reach out to you directly. You do not need to wait for that. If you are in immediate danger, please call 112 right now, it is Nigeria's national emergency line and it works from any network.

You can also speak to a trained counsellor immediately, for free and in confidence, through the Suicide Research and Prevention Initiative on 0800 078 7746, any time, day or night.

God sees you in this moment, and so do we. "The Lord is close to the brokenhearted and saves those who are crushed in spirit." Psalm 34:18. Please reach out to someone at Eden Life today, you are not a burden, you are family.`
}
