import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'

// The banner compares the commit this bundle was built from against the commit
// the server is actually serving. That build stamp is inlined by Next at build
// time; tests set it explicitly per case.
const ENV = process.env as Record<string, string | undefined>
function setBuiltSha(sha: string | undefined) {
  if (sha === undefined) delete ENV.NEXT_PUBLIC_BUILD_SHA
  else ENV.NEXT_PUBLIC_BUILD_SHA = sha
}

const holder = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/client', () => ({ createClient: () => holder.client }))

import StaleDeploymentBanner from '@/components/StaleDeploymentBanner'

function mockVersion(payload: Record<string, unknown>, ok = true) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    json: async () => payload,
  } as unknown as Response)
}

/** Stands in for the browser client: the banner only needs auth + a role read. */
function mountAs(role: string | null) {
  holder.client = {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            table === 'profiles' ? { data: { role }, error: null } : { data: null, error: null },
        }),
      }),
    }),
  }
}

const BUILT = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const LIVE = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

// Long enough for the banner's async check (2 awaits) to settle.
const settle = () => new Promise(r => setTimeout(r, 40))

describe('StaleDeploymentBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    delete ENV.NEXT_PUBLIC_BUILD_SHA
  })

  it('warns an admin when the served build is not the build this page came from', async () => {
    setBuiltSha(BUILT)
    mockVersion({ commit: LIVE, shortCommit: LIVE.slice(0, 7), ref: 'arena/01a0a1cc' })
    mountAs('admin')

    render(<StaleDeploymentBanner />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain(BUILT.slice(0, 7))
    expect(alert.textContent).toContain(LIVE.slice(0, 7))
    // It has to say what to do, not just that something is wrong.
    expect(alert.textContent).toMatch(/Redeploy/i)
  })

  it('stays silent when the served build matches the bundle', async () => {
    setBuiltSha(BUILT)
    mockVersion({ commit: BUILT, shortCommit: BUILT.slice(0, 7), ref: 'main' })
    mountAs('admin')

    const { container } = render(<StaleDeploymentBanner />)

    await settle()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('never shows the warning to non-admins', async () => {
    setBuiltSha(BUILT)
    mockVersion({ commit: LIVE, shortCommit: LIVE.slice(0, 7), ref: 'main' })
    mountAs('student')

    render(<StaleDeploymentBanner />)

    await settle()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('stays silent when the build stamp is unknown (local dev, no git)', async () => {
    setBuiltSha(undefined)
    const fetchSpy = mockVersion({ commit: LIVE })
    mountAs('admin')

    render(<StaleDeploymentBanner />)

    await settle()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    // No stamp → nothing to compare → don't even hit the network.
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('stays silent when /api/build-version fails instead of breaking the page', async () => {
    setBuiltSha(BUILT)
    mockVersion({}, false)
    mountAs('admin')

    render(<StaleDeploymentBanner />)

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    await settle()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('can be dismissed', async () => {
    setBuiltSha(BUILT)
    mockVersion({ commit: LIVE, ref: 'main' })
    mountAs('admin')

    render(<StaleDeploymentBanner />)

    await screen.findByRole('alert')
    screen.getByLabelText(/dismiss stale deployment warning/i).click()
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
})
