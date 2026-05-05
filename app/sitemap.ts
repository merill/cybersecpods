import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"
import {
  getAllPodcasts,
  getAllTags,
  getEpisodesForPodcast,
} from "@/lib/podcasts"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url
  const now = new Date()

  const podcasts = getAllPodcasts()
  const tags = getAllTags()

  const podcastEntries: MetadataRoute.Sitemap = podcasts.map((p) => ({
    url: `${base}/podcasts/${p.id}/`,
    lastModified: p.lastEpisodeDate ? new Date(p.lastEpisodeDate) : now,
    changeFrequency: p.isActive ? "weekly" : "monthly",
    priority: p.isActive ? 0.8 : 0.4,
  }))

  const tagEntries: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${base}/tags/${t}/`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  const episodeEntries: MetadataRoute.Sitemap = []
  const STATIC_EPISODES_PER_PODCAST = 25
  for (const p of podcasts) {
    const eps = [...getEpisodesForPodcast(p.id)].sort((a, b) => {
      const ta = new Date(a.publishedAt).getTime() || 0
      const tb = new Date(b.publishedAt).getTime() || 0
      return tb - ta
    })
    for (const e of eps.slice(0, STATIC_EPISODES_PER_PODCAST)) {
      if (!e.publishedAt) continue
      episodeEntries.push({
        url: `${base}/podcasts/${p.id}/${e.id}/`,
        lastModified: new Date(e.publishedAt),
        changeFrequency: "yearly",
        priority: 0.5,
      })
    }
  }

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${base}/podcasts/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/episodes/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${base}/tags/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${base}/about/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...podcastEntries,
    ...tagEntries,
    ...episodeEntries,
  ]
}
