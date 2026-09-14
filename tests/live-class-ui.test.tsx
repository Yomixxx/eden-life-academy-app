import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { makeSupabaseMock } from './helpers/mock-supabase'

const holder = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/client', () => ({ createClient: () => holder.client }))

import LiveClassBanner from '@/components/LiveClassBanner'
import LiveClassCard from '@/components/LiveClassCard'

const MEET_URL = 'https://meet.google.com/abc-defg-hij'

function mountWith(rows: Array<Record<string, unknown>>) {
  const mock = makeSupabaseMock(rows)
  holder.client = mock.client
  return mock
}

describe('LiveClassBanner (student dashboard)', () => {
  beforeEach(() => {
    mountWith([])
  })

  it('renders the Join Class button pointing at the Meet link when the class is live', async () => {
    mountWith([{ level: '200', meet_url: MEET_URL, schedule_label: 'Saturdays 8:30–9:30AM', is_live: true }])
    render(
      <LiveClassBanner
        level="200"
        courseHref="/catalog/cohort-3"
        initial={{ level: '200', meet_url: MEET_URL, schedule_label: 'Saturdays 8:30–9:30AM', is_live: true }}
      />
    )
    const join = await screen.findByRole('link', { name: /join class/i })
    expect(join).toHaveAttribute('href', MEET_URL)
    expect(join).toHaveAttribute('target', '_blank')
  })

  it('still shows the card, schedule and course link before the class goes live', async () => {
    // Regression: this component used to `return null` whenever is_live was
    // false, so a student on the dashboard at 8:20 on a Saturday saw no live
    // class UI at all and had no idea where the button would appear.
    mountWith([{ level: '200', meet_url: MEET_URL, schedule_label: 'Saturdays 8:30–9:30AM', is_live: false }])
    render(
      <LiveClassBanner
        level="200"
        courseHref="/catalog/cohort-3"
        initial={{ level: '200', meet_url: MEET_URL, schedule_label: 'Saturdays 8:30–9:30AM', is_live: false }}
      />
    )
    expect(await screen.findByText('200 Level class')).toBeInTheDocument()
    expect(screen.getByText('Saturdays 8:30–9:30AM')).toBeInTheDocument()
    expect(screen.getByText(/your join button appears here the moment your host starts the class/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open course/i })).toHaveAttribute('href', '/catalog/cohort-3')
    expect(screen.queryByRole('link', { name: /join class/i })).not.toBeInTheDocument()
  })

  it('explains a missing Meet link while live instead of rendering no button', async () => {
    // Regression: the join button was guarded on `meet_url`, so an admin who
    // started the meeting without a saved link produced a banner that said
    // "class is live now" with nothing to click.
    mountWith([{ level: '200', meet_url: null, schedule_label: 'Saturdays 8:30–9:30AM', is_live: true }])
    render(
      <LiveClassBanner
        level="200"
        courseHref="/catalog/cohort-3"
        initial={{ level: '200', meet_url: null, schedule_label: 'Saturdays 8:30–9:30AM', is_live: true }}
      />
    )
    expect(await screen.findByText('200 Level class is live now')).toBeInTheDocument()
    expect(screen.getByText(/your host is posting the meeting link/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /check again/i })).toBeInTheDocument()
  })
})

describe('LiveClassCard (course page)', () => {
  it('shows a "link coming" placeholder while live with no Meet link saved', async () => {
    mountWith([{ level: '300', meet_url: null, schedule_label: 'Saturdays 8:30–9:30AM', is_live: true }])
    render(<LiveClassCard level="300" initial={{ level: '300', meet_url: null, schedule_label: 'Saturdays 8:30–9:30AM', is_live: true }} />)
    expect(await screen.findByText('Class is live now')).toBeInTheDocument()
    expect(screen.getByText('Link coming…')).toBeInTheDocument()
    expect(screen.getByText(/it appears here automatically within about 20 seconds/i)).toBeInTheDocument()
  })

  it('renders the Join Class link when live with a Meet link saved', async () => {
    mountWith([{ level: '300', meet_url: MEET_URL, schedule_label: 'Saturdays 8:30–9:30AM', is_live: true }])
    render(<LiveClassCard level="300" initial={{ level: '300', meet_url: MEET_URL, schedule_label: 'Saturdays 8:30–9:30AM', is_live: true }} />)
    expect(await screen.findByRole('link', { name: /join class/i })).toHaveAttribute('href', MEET_URL)
  })
})
