'use client'

import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Self-hosted via the bundler (not a CDN) so the worker version always
// matches the installed pdfjs-dist version exactly — pdf.js refuses to run
// if the two ever drift apart — and so rendering never depends on a
// third-party CDN being reachable.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

interface PdfViewerProps {
  url: string
  title: string
  downloadLabel?: string
}

// Renders PDFs page-by-page as canvases scaled to fit the container width —
// the same approach Coursera/Udemy use for in-app documents — instead of a
// raw <iframe src={pdfUrl}>, whose native browser PDF chrome renders tiny,
// unusably cramped, or not at all inside many mobile browsers (notably
// iOS Safari and in-app webviews like Instagram/Facebook's).
export default function PdfViewer({ url, title, downloadLabel }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [numPages, setNumPages] = useState(0)
  const [visiblePage, setVisiblePage] = useState(1)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(Math.floor(w))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (failed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', marginTop: '.75rem', color: 'var(--eden)', fontWeight: 600, fontSize: '.85rem' }}>
        {downloadLabel || 'Download attachment'} (couldn&apos;t preview this file in-app — opens in a new tab instead)
      </a>
    )
  }

  return (
    <div style={{ marginTop: '.85rem', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-0)' }}>
      {numPages > 0 && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '.5rem', fontSize: '.75rem', fontWeight: 600, color: 'var(--text-md)',
          background: 'var(--bg-0)', borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-poppins), Poppins, sans-serif',
        }}>
          Page {visiblePage} of {numPages}
        </div>
      )}
      <div
        ref={containerRef}
        onScroll={e => {
          if (!numPages) return
          const el = e.currentTarget
          const pageEls = el.querySelectorAll<HTMLElement>('[data-page-number]')
          for (const pageEl of Array.from(pageEls)) {
            const rect = pageEl.getBoundingClientRect()
            const containerRect = el.getBoundingClientRect()
            if (rect.top - containerRect.top >= -rect.height / 2) {
              setVisiblePage(Number(pageEl.dataset.pageNumber))
              break
            }
          }
        }}
        style={{ width: '100%', maxHeight: '75vh', overflowY: 'auto' }}
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => setFailed(true)}
          loading={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-lo)', fontSize: '.85rem' }}>Loading {title}…</div>}
          error={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-lo)', fontSize: '.85rem' }}>Couldn&apos;t load this document.</div>}
        >
          {width > 0 && Array.from({ length: numPages }, (_, i) => (
            <div key={i} data-page-number={i + 1} style={{ borderBottom: i < numPages - 1 ? '1px solid var(--border)' : 'none' }}>
              <Page pageNumber={i + 1} width={width} renderAnnotationLayer renderTextLayer />
            </div>
          ))}
        </Document>
      </div>
    </div>
  )
}
