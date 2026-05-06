import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"
import { CATEGORY_GROUPS } from "@/lib/categories"
import { BEST_PODCAST_PAGES } from "@/lib/editorial-seo"
import { getAllPodcasts, getEpisodesForPodcast } from "@/lib/podcasts"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url
  const now = new Date()

  const podcasts = getAllPodcasts()
  const categorySlugs = CATEGORY_GROUPS.flatMap((g) => g.categories)

  const podcastEntries: MetadataRoute.Sitemap = podcasts.map((p) => ({
    url: `${base}/podcasts/${p.id}/`,
    lastModified: p.lastEpisodeDate ? new Date(p.lastEpisodeDate) : now,
    changeFrequency: p.isActive ? "weekly" : "monthly",
    priority: p.isActive ? 0.8 : 0.4,
  }))

  const categoryEntries: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${base}/categories/${slug}/`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  const bestPodcastEntries: MetadataRoute.Sitemap = BEST_PODCAST_PAGES.map(
    (page) => ({
      url: `${base}/${page.slug}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    })
  )

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
      url: `${base}/categories/`,
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
    {
      url: `${base}/rankings/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...bestPodcastEntries,
    ...podcastEntries,
    ...categoryEntries,
    ...episodeEntries,
  ]
}
