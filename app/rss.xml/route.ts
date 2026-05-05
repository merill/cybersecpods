import { siteConfig } from "@/config/site"
import { getLatestEpisodes } from "@/lib/podcasts"
import { stripHtml } from "@/lib/seo"

export const dynamic = "force-static"
export const revalidate = false

function escape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function GET(): Response {
  const episodes = getLatestEpisodes(50)
  const updated = episodes[0]?.publishedAt
    ? new Date(episodes[0].publishedAt).toUTCString()
    : new Date().toUTCString()

  const items = episodes
    .map((e) => {
      const url = `${siteConfig.url}/podcasts/${e.podcastId}/${e.id}/`
      const desc = stripHtml(e.description || "").slice(0, 600)
      const pubDate = e.publishedAt
        ? new Date(e.publishedAt).toUTCString()
        : new Date().toUTCString()
      const enclosure = e.audioUrl || e.videoUrl
      const enclosureType = e.videoUrl
        ? "video/mp4"
        : e.audioUrl?.endsWith(".m4a")
        ? "audio/x-m4a"
        : "audio/mpeg"
      return `    <item>
      <title>${escape(e.title)}</title>
      <link>${escape(url)}</link>
      <guid isPermaLink="true">${escape(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escape(desc)}</description>
      <category>${escape(e.podcast.title)}</category>${
        enclosure
          ? `\n      <enclosure url="${escape(enclosure)}" type="${enclosureType}" />`
          : ""
      }
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(siteConfig.name)} – Latest Episodes</title>
    <link>${escape(siteConfig.url)}</link>
    <atom:link href="${escape(siteConfig.url)}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escape(siteConfig.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${updated}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
