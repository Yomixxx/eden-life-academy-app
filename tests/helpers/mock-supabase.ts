export type Row = Record<string, unknown>

type EqValue = unknown

/**
 * Minimal stand-in for the browser Supabase client that is chainable the way
 * the live-class code chains it: `from(t).select('*')`, `...eq().maybeSingle()`,
 * and `from(t).update(payload).eq(col, val)` — including `await select('*')`,
 * which means the query object has to be a thenable.
 */
export function makeSupabaseMock(rows: Row[], opts: { updateError?: { message: string } | null } = {}) {
  const updates: Array<{ table: string; payload: Row; eq: EqValue }> = []
  const inserts: Array<{ table: string; payload: Row }> = []

  const makeQuery = (resolve: (eqValue: EqValue) => Promise<{ data: unknown; error: unknown }>) => {
    const q: Record<string, unknown> = {}
    let eqValue: EqValue
    q.eq = (_col: string, value: unknown) => { eqValue = value; return q }
    q.maybeSingle = () => resolve(eqValue)
    q.single = () => resolve(eqValue)
    q.limit = () => q
    q.order = () => q
    q.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      resolve(eqValue).then(onFulfilled, onRejected)
    return q
  }

  const client = {
    from: (table: string) => ({
      select: () => makeQuery(async (eqValue) => {
        if (eqValue === undefined) return { data: rows, error: null }
        return { data: rows.find(r => r.level === eqValue) ?? null, error: null }
      }),
      update: (payload: Row) => ({
        eq: (_col: string, value: EqValue) => {
          updates.push({ table, payload, eq: value })
          return Promise.resolve({ data: null, error: opts.updateError ?? null })
        },
      }),
      insert: (payload: Row) => {
        inserts.push({ table, payload })
        return Promise.resolve({ data: null, error: null })
      },
    }),
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
    },
  }

  return { client, updates, inserts }
}
