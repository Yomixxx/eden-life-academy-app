'use client'

import { useState, useEffect, useCallback } from 'react'

const OT = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi']
const NT = ['Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation']

const CHAPTER_COUNTS: Record<string, number> = {
  Genesis:50,Exodus:40,Leviticus:27,Numbers:36,Deuteronomy:34,Joshua:24,Judges:21,Ruth:4,'1 Samuel':31,'2 Samuel':24,'1 Kings':22,'2 Kings':25,'1 Chronicles':29,'2 Chronicles':36,Ezra:10,Nehemiah:13,Esther:10,Job:42,Psalms:150,Proverbs:31,Ecclesiastes:12,'Song of Solomon':8,Isaiah:66,Jeremiah:52,Lamentations:5,Ezekiel:48,Daniel:12,Hosea:14,Joel:3,Amos:9,Obadiah:1,Jonah:4,Micah:7,Nahum:3,Habakkuk:3,Zephaniah:3,Haggai:2,Zechariah:14,Malachi:4,
  Matthew:28,Mark:16,Luke:24,John:21,Acts:28,Romans:16,'1 Corinthians':16,'2 Corinthians':13,Galatians:6,Ephesians:6,Philippians:4,Colossians:4,'1 Thessalonians':5,'2 Thessalonians':3,'1 Timothy':6,'2 Timothy':4,Titus:3,Philemon:1,Hebrews:13,James:5,'1 Peter':5,'2 Peter':3,'1 John':5,'2 John':1,'3 John':1,Jude:1,Revelation:22,
}

const VOTD_POOL = [
  { ref: 'Proverbs 4:7', text: 'Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.' },
  { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
  { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.' },
  { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
  { ref: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.' },
  { ref: 'Isaiah 40:31', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
  { ref: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' },
  { ref: 'Proverbs 3:5', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { ref: 'Joshua 1:9', text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.' },
  { ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
  { ref: 'Romans 12:2', text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.' },
  { ref: '2 Timothy 3:16', text: 'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.' },
  { ref: 'Hebrews 11:1', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.' },
]

interface BibleVerse { book_name: string; chapter: number; verse: number; text: string }

export default function BiblePage() {
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchResult, setSearchResult] = useState<{ reference: string; text: string } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [translation, setTranslation] = useState('kjv')
  const [activeTab, setActiveTab] = useState<'reader' | 'search'>('reader')

  const votd = VOTD_POOL[new Date().getDate() % VOTD_POOL.length]

  const fetchChapter = useCallback(async (book: string, chapter: number) => {
    setLoading(true)
    setError('')
    setVerses([])
    const query = `${encodeURIComponent(book.toLowerCase().replace(/ /g, '+'))}+${chapter}`
    try {
      const res = await fetch(`https://bible-api.com/${query}?translation=${translation}`)
      if (!res.ok) throw new Error('Chapter not found')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setVerses(data.verses ?? [])
    } catch {
      setError('Could not load chapter. Please try again.')
    }
    setLoading(false)
  }, [translation])

  useEffect(() => {
    if (selectedBook && selectedChapter) fetchChapter(selectedBook, selectedChapter)
  }, [selectedBook, selectedChapter, fetchChapter])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) return
    setSearchLoading(true)
    setSearchError('')
    setSearchResult(null)
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(search.trim())}?translation=${translation}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSearchResult({ reference: data.reference, text: data.text })
    } catch {
      setSearchError('Passage not found. Try "John 3:16" or "Psalm 23".')
    }
    setSearchLoading(false)
  }

  const chapterCount = selectedBook ? CHAPTER_COUNTS[selectedBook] ?? 50 : 0

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Word &amp; Media</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>Bible</h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>Read, study, and explore the Word of God.</p>
      </div>

      {/* Verse of the Day */}
      <div style={{ background: 'linear-gradient(135deg,rgba(94,201,87,.1),rgba(94,201,87,.04))', border: '1px solid rgba(94,201,87,.25)', borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(94,201,87,.05)', pointerEvents: 'none' }} />
        <p style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.85rem' }}>Verse of the Day</p>
        <blockquote style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontSize: 'clamp(1rem,2vw,1.2rem)', fontWeight: 600, color: 'var(--text-hi)', lineHeight: 1.65, marginBottom: '.85rem', fontStyle: 'italic' }}>
          &ldquo;{votd.text}&rdquo;
        </blockquote>
        <span style={{ color: 'var(--eden)', fontWeight: 700, fontSize: '.95rem' }}>{votd.ref}</span>
      </div>

      {/* Translation + Tabs */}
      <div className="bible-tab-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {(['reader', 'search'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600,
              background: activeTab === tab ? 'var(--eden)' : 'var(--bg-2)',
              color: activeTab === tab ? 'var(--bg-0)' : 'var(--text-md)',
              fontFamily: 'var(--font-poppins), Poppins, sans-serif',
            }}>{tab === 'reader' ? 'Bible Reader' : 'Look Up Passage'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '.78rem', color: 'var(--text-lo)' }}>Translation:</span>
          <select value={translation} onChange={e => setTranslation(e.target.value)} style={{
            background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text-hi)', padding: '.35rem .75rem', fontSize: '.82rem', cursor: 'pointer',
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          }}>
            <option value="kjv">KJV</option>
            <option value="web">WEB</option>
            <option value="asv">ASV</option>
            <option value="bbe">BBE</option>
          </select>
        </div>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1.25rem' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='e.g. "John 3:16" or "Psalm 23" or "Romans 8:28-30"'
              style={{
                flex: '1 1 200px', minWidth: 0, minHeight: 44, boxSizing: 'border-box',
                background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '.75rem 1rem', color: 'var(--text-hi)', fontSize: '.9rem',
                fontFamily: 'var(--font-poppins), Poppins, sans-serif',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--eden)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <button type="submit" disabled={searchLoading} style={{
              background: 'var(--eden)', color: 'var(--bg-0)', border: 'none', borderRadius: 8,
              padding: '.75rem 1.25rem', minHeight: 44, fontWeight: 600, fontSize: '.9rem', cursor: 'pointer',
              fontFamily: 'var(--font-poppins), Poppins, sans-serif', whiteSpace: 'nowrap',
            }}>{searchLoading ? 'Looking up…' : 'Look Up'}</button>
          </form>
          {searchError && <p style={{ color: '#fca5a5', fontSize: '.85rem', marginBottom: '1rem' }}>{searchError}</p>}
          {searchResult && (
            <div>
              <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--eden)', marginBottom: '.75rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>{searchResult.reference}</p>
              <p style={{ color: 'var(--text-hi)', lineHeight: 1.85, fontSize: '.95rem', fontStyle: 'italic' }}>&ldquo;{searchResult.text.trim()}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* Reader Tab */}
      {activeTab === 'reader' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Book + Chapter pickers */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
            <select
              value={selectedBook ?? ''}
              onChange={e => { const book = e.target.value; setSelectedBook(book || null); setSelectedChapter(book ? 1 : null) }}
              style={{
                flex: '1 1 220px', minWidth: 0, minHeight: 48, boxSizing: 'border-box',
                background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10,
                color: selectedBook ? 'var(--text-hi)' : 'var(--text-lo)', padding: '.85rem 1rem',
                fontSize: '.9rem', cursor: 'pointer', fontFamily: 'var(--font-poppins), Poppins, sans-serif',
              }}
            >
              <option value="" disabled>Select a book</option>
              <optgroup label="Old Testament">
                {OT.map(book => <option key={book} value={book}>{book}</option>)}
              </optgroup>
              <optgroup label="New Testament">
                {NT.map(book => <option key={book} value={book}>{book}</option>)}
              </optgroup>
            </select>
            <select
              value={selectedChapter ?? ''}
              onChange={e => setSelectedChapter(Number(e.target.value))}
              disabled={!selectedBook}
              style={{
                flex: '1 1 140px', minWidth: 0, minHeight: 48, boxSizing: 'border-box',
                background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10,
                color: selectedChapter ? 'var(--text-hi)' : 'var(--text-lo)', padding: '.85rem 1rem',
                fontSize: '.9rem', cursor: selectedBook ? 'pointer' : 'not-allowed',
                opacity: selectedBook ? 1 : 0.6, fontFamily: 'var(--font-poppins), Poppins, sans-serif',
              }}
            >
              <option value="" disabled>Chapter</option>
              {Array.from({ length: chapterCount }, (_, i) => i + 1).map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>
          </div>

          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', minHeight: 300 }}>
            {!selectedBook && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-lo)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto .75rem', opacity: .4, display: 'block' }}>
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <p style={{ fontSize: '.9rem' }}>Select a book to start reading</p>
              </div>
            )}
            {selectedBook && loading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>Loading…</div>
            )}
            {selectedBook && !loading && error && (
              <p style={{ color: '#fca5a5', fontSize: '.88rem' }}>{error}</p>
            )}
            {selectedBook && !loading && !error && verses.length > 0 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '1.25rem' }}>
                  {selectedBook} {selectedChapter}
                </h2>
                <div style={{ lineHeight: 2, fontSize: '1rem', color: 'var(--text-md)' }}>
                  {verses.map(v => (
                    <span key={v.verse}>
                      <sup style={{ fontSize: '.68rem', color: 'var(--eden)', fontWeight: 700, marginRight: '.2rem', userSelect: 'none' }}>{v.verse}</sup>
                      {v.text.trim()}{' '}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '1.5rem' }}>
                  {selectedChapter && selectedChapter > 1 && (
                    <button onClick={() => setSelectedChapter(c => (c ?? 2) - 1)} style={{ flex: '1 1 auto', padding: '.7rem 1.25rem', minHeight: 44, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-md)', fontSize: '.85rem', cursor: 'pointer', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}>← Previous</button>
                  )}
                  {selectedChapter && selectedChapter < chapterCount && (
                    <button onClick={() => setSelectedChapter(c => (c ?? 0) + 1)} style={{ flex: '1 1 auto', padding: '.7rem 1.25rem', minHeight: 44, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-md)', fontSize: '.85rem', cursor: 'pointer', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}>Next →</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .bible-tab-row { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
    </div>
  )
}
