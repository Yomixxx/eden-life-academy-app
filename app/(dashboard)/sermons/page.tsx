'use client'

import { useState } from 'react'

const CHANNEL_URL = 'https://www.youtube.com/@edenlifeglobal'

interface YTVideo {
  videoId: string
  title: string
  published: string
  thumbnail: string
}

function VideoCard({ video }: { video: YTVideo }) {
  const [playing, setPlaying] = useState(false)
  const date = new Date(video.published).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {playing ? (
        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          onClick={() => setPlaying(true)}
          style={{ position: 'relative', aspectRatio: '16/9', cursor: 'pointer', border: 'none', padding: 0, background: '#000', display: 'block', width: '100%' }}
        >
          <img
            src={video.thumbnail}
            alt={video.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: .92 }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(255,68,68,.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform .15s, background .15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#ff4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,68,68,.9)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 3 }}>
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
        </button>
      )}
      <div style={{ padding: '.9rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '.88rem', color: 'var(--text-hi)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</p>
        <p style={{ margin: 0, fontSize: '.72rem', color: 'var(--text-lo)' }}>{date}</p>
      </div>
    </div>
  )
}

function LiveBanner() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,68,68,.12), rgba(255,68,68,.04))',
      border: '1px solid rgba(255,68,68,.25)',
      borderRadius: 14, padding: '1rem 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#ff4444',
          display: 'inline-block', animation: 'livepulse 1.8s ease-in-out infinite', flexShrink: 0,
        }} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '.9rem', color: 'var(--text-hi)' }}>Watch Live on YouTube</p>
          <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-lo)' }}>Sundays 10:00 AM (Lagos time)</p>
        </div>
      </div>
      <a
        href={`${CHANNEL_URL}/live`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: '.4rem',
          background: '#ff4444', color: '#fff',
          padding: '.55rem 1.1rem', borderRadius: 8,
          fontSize: '.82rem', fontWeight: 600, textDecoration: 'none',
          minHeight: 36, cursor: 'pointer', transition: 'opacity .15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.8C6.8 19 12 19 12 19s4.8 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l5.5 3-5.5 3z"/>
        </svg>
        Watch Live
      </a>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px dashed var(--border)',
      borderRadius: 14, padding: '3rem', textAlign: 'center',
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto .85rem', display: 'block', opacity: .5 }}>
        <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.8C6.8 19 12 19 12 19s4.8 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l5.5 3-5.5 3z"/>
      </svg>
      <p style={{ color: 'var(--text-lo)', fontSize: '.9rem', margin: '0 0 1rem' }}>
        Could not load YouTube videos. Visit the channel directly.
      </p>
      <a
        href={CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: '.85rem', color: 'var(--eden)', fontWeight: 500 }}
      >
        Open YouTube Channel
      </a>
    </div>
  )
}

export default function SermonsPage() {
  const [videos, setVideos] = useState<YTVideo[] | null>(null)
  const [error, setError] = useState(false)

  // Fetch on mount
  if (videos === null && !error) {
    fetch('/api/youtube-feed')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: YTVideo[]) => setVideos(data))
      .catch(() => setError(true))
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Word &amp; Media</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>Sermons</h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>Messages from Eden Life Experience Centre.</p>
      </div>

      <LiveBanner />

      {videos === null && !error ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '16/9', background: 'var(--bg-3)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              <div style={{ padding: '.9rem 1rem' }}>
                <div style={{ height: 14, background: 'var(--bg-3)', borderRadius: 4, marginBottom: '.5rem', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                <div style={{ height: 14, background: 'var(--bg-3)', borderRadius: 4, width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
          {videos!.map(v => <VideoCard key={v.videoId} video={v} />)}
        </div>
      )}

      <style>{`
        @keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>
    </div>
  )
}
