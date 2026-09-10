'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center', backgroundColor: '#090a0f', color: '#fff' }}>
        <h2>Something went wrong</h2>
        <button
          onClick={() => reset()}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', background: '#9fe870', color: '#000', border: 'none', cursor: 'pointer' }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
