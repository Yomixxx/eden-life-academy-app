export const revalidate = 3600

async function getChannelId(): Promise<string | null> {
  const res = await fetch('https://www.youtube.com/@edenlifeglobal', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html',
    },
    next: { revalidate: 86400 },
  })
  const html = await res.text()
  const m = html.match(/"channelId"\s*:\s*"(UC[\w-]+)"/)
    || html.match(/"externalId"\s*:\s*"(UC[\w-]+)"/)
    || html.match(/channel\/(UC[\w-]{22,})/)
  return m ? m[1] : null
}

export async function GET() {
  try {
    const channelId = await getChannelId()
    if (!channelId) {
      return Response.json({ error: 'channel_id_not_found' }, { status: 502 })
    }

    const rssRes = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 3600 } }
    )
    if (!rssRes.ok) {
      return Response.json({ error: 'rss_fetch_failed' }, { status: 502 })
    }

    const xml = await rssRes.text()
    const entries = xml.split('<entry>').slice(1)

    const videos = entries.map(entry => {
      const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? ''
      const rawTitle = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
      const title = rawTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? ''
      const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      return { videoId, title, published, thumbnail }
    }).filter(v => v.videoId)

    return Response.json(videos, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
