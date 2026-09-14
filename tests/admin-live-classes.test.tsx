import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { makeSupabaseMock } from './helpers/mock-supabase'

const holder = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/client', () => ({ createClient: () => holder.client }))

import AdminLiveClasses from '@/app/admin/live-classes/page'

const SEEDED: Array<Record<string, unknown>> = [
  { level: '100', meet_url: null, schedule_label: 'Saturdays 8:30–9:30AM', is_live: false, updated_at: '2026-09-12T08:00:00Z' },
  { level: '200', meet_url: null, schedule_label: 'Saturdays 8:30–9:30AM', is_live: false, updated_at: '2026-09-12T08:00:00Z' },
  { level: '300', meet_url: null, schedule_label: 'Saturdays 8:30–9:30AM', is_live: false, updated_at: '2026-09-12T08:00:00Z' },
]

const MEET_URL = 'https://meet.google.com/abc-defg-hij'

function mountAdmin(rows = SEEDED) {
  const mock = makeSupabaseMock(rows)
  holder.client = mock.client
  render(<AdminLiveClasses />)
  return mock
}

describe('Admin → Live Classes → Go Live', () => {
  it('refuses to go live with no Meet link, and writes nothing', async () => {
    // Regression: Go Live used to write only is_live, so an admin could start
    // a session and every student saw "class is live now" with no join button.
    const { updates } = mountAdmin()
    const goLive = (await screen.findAllByRole('button', { name: /go live/i }))[0]
    fireEvent.click(goLive)

    expect(await screen.findByText(/add the google meet link first/i)).toBeInTheDocument()
    expect(updates).toHaveLength(0)
  })

  it('saves the typed Meet link in the same write as going live', async () => {
    const { updates } = mountAdmin()
    const meetInput = (await screen.findAllByPlaceholderText('https://meet.google.com/xxx-xxxx-xxx'))[0]
    fireEvent.change(meetInput, { target: { value: MEET_URL } })

    expect(await screen.findByText(/unsaved changes/i)).toBeInTheDocument()

    const goLive = screen.getAllByRole('button', { name: /go live/i })[0]
    fireEvent.click(goLive)

    expect(await screen.findByText(/live in the database/i)).toBeInTheDocument()
    expect(updates).toHaveLength(1)
    expect(updates[0].table).toBe('class_links')
    expect(updates[0].eq).toBe('100')
    expect(updates[0].payload).toMatchObject({ is_live: true, meet_url: MEET_URL, schedule_label: 'Saturdays 8:30–9:30AM' })
  })

  it('ends a live session without touching the saved link', async () => {
    const { updates } = mountAdmin([
      { ...SEEDED[0], meet_url: MEET_URL, is_live: true },
      SEEDED[1],
      SEEDED[2],
    ])
    const endLive = (await screen.findAllByRole('button', { name: /end live/i }))[0]
    fireEvent.click(endLive)

    expect(await screen.findByText(/live ended in the database/i)).toBeInTheDocument()
    expect(updates).toHaveLength(1)
    expect(updates[0].payload).toEqual({ is_live: false })
  })
})
