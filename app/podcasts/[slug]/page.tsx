import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getAllPodcasts,
  getEpisodesForPodcast,
  getPodcastById,
} from "@/lib/podcasts"
import { episodeJsonLd, podcastJsonLd, podcastMetadata } from "@/lib/seo"
import { PodcastHero } from "@/components/podcast/podcast-hero"
import { EpisodeList } from "@/components/podcast/episode-list"

interface PageProps {
  params: { slug: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPodcasts().map((p) => ({ slug: p.id }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const podcast = getPodcastById(params.slug)
  if (!podcast) return {}
  return podcastMetadata(podcast)
}

export default function PodcastPage({ params }: PageProps) {
  const podcast = getPodcastById(params.slug)
  if (!podcast) notFound()
  const episodes = getEpisodesForPodcast(podcast.id)

  // Sort newest-first
  const sorted = [...episodes].sort((a, b) => {
    const ta = new Date(a.publishedAt).getTime() || 0
    const tb = new Date(b.publishedAt).getTime() || 0
    return tb - ta
  })

  // JSON-LD: include up to 25 most recent episodes for richer schema
  const ldRecent = sorted.slice(0, 25)
  const ld = [
    podcastJsonLd(podcast),
    ...ldRecent.map((e) => episodeJsonLd(podcast, e)),
  ]

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <PodcastHero podcast={podcast} />
      <div className="container py-8 md:py-12">
        <EpisodeList podcast={podcast} episodes={sorted} />
      </div>
    </article>
  )
}
