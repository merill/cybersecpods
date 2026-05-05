import type { Metadata } from "next"
import { Suspense } from "react"

import { siteConfig } from "@/config/site"
import { getAllPodcasts, getPopularTags } from "@/lib/podcasts"
import { DEFAULT_OG_IMAGES } from "@/lib/seo"
import { PodcastsBrowser } from "@/components/podcast/podcasts-browser"

export const metadata: Metadata = {
  title: "All Cybersecurity Podcasts",
  description:
    "Browse and filter the full directory of cybersecurity podcasts — search by name, host, or topic, sort by ratings, reviews, or recency.",
  alternates: { canonical: siteConfig.url + "/podcasts/" },
  openGraph: {
    title: `All Cybersecurity Podcasts | ${siteConfig.name}`,
    description:
      "Search and filter every cybersecurity podcast in the directory.",
    url: siteConfig.url + "/podcasts/",
    type: "website",
    images: [...DEFAULT_OG_IMAGES],
  },
}

export default function PodcastsPage() {
  const podcasts = getAllPodcasts()
  const tags = getPopularTags(1)

  return (
    <div className="container py-8 md:py-12">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          All Cybersecurity Podcasts
        </h1>
        <p className="mt-2 text-muted-foreground">
          {podcasts.filter((p) => p.isActive).length} active shows ·{" "}
          {podcasts.length} total. Filter by category, search by name or host,
          or sort by ratings.
        </p>
      </header>
      <Suspense fallback={<div className="h-96" />}>
        <PodcastsBrowser podcasts={podcasts} allTags={tags} />
      </Suspense>
    </div>
  )
}
