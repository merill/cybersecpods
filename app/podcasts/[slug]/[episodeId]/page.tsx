import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  getAllPodcasts,
  getEpisode,
  getEpisodesForPodcast,
  getPodcastById,
} from "@/lib/podcasts"
import { episodeJsonLd, episodeMetadata, stripHtml } from "@/lib/seo"
import { formatDate, formatDuration } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { EpisodePlayer } from "@/components/episode/episode-player"

interface PageProps {
  params: { slug: string; episodeId: string }
}

export const dynamicParams = false

const STATIC_EPISODES_PER_PODCAST = 25

export function generateStaticParams() {
  const out: { slug: string; episodeId: string }[] = []
  for (const p of getAllPodcasts()) {
    const eps = [...getEpisodesForPodcast(p.id)].sort((a, b) => {
      const ta = new Date(a.publishedAt).getTime() || 0
      const tb = new Date(b.publishedAt).getTime() || 0
      return tb - ta
    })
    for (const e of eps.slice(0, STATIC_EPISODES_PER_PODCAST)) {
      out.push({ slug: p.id, episodeId: e.id })
    }
  }
  return out
}

export function generateMetadata({ params }: PageProps): Metadata {
  const podcast = getPodcastById(params.slug)
  if (!podcast) return {}
  const episode = getEpisode(podcast.id, params.episodeId)
  if (!episode) return {}
  return episodeMetadata(podcast, episode)
}

export default function EpisodePage({ params }: PageProps) {
  const podcast = getPodcastById(params.slug)
  if (!podcast) notFound()
  const episode = getEpisode(podcast.id, params.episodeId)
  if (!episode) notFound()

  const all = getEpisodesForPodcast(podcast.id)
  const sorted = [...all].sort((a, b) => {
    const ta = new Date(a.publishedAt).getTime() || 0
    const tb = new Date(b.publishedAt).getTime() || 0
    return tb - ta
  })
  const idx = sorted.findIndex((e) => e.id === episode.id)
  const next = idx > 0 ? sorted[idx - 1] : null // newer
  const prev = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null

  const ld = episodeJsonLd(podcast, episode)

  const coverImg = episode.imageUrl ?? podcast.image

  return (
    <article className="container py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <Link
        href={`/podcasts/${podcast.id}/`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <Icons.arrowLeft className="h-4 w-4" />
        {podcast.title}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted shadow-md">
            {coverImg ? (
              <Image
                src={coverImg}
                alt={podcast.title}
                fill
                sizes="(min-width: 1024px) 260px, 200px"
                className="object-cover"
                priority
              />
            ) : null}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Link
              href={`/podcasts/${podcast.id}/`}
              className="font-medium text-foreground hover:underline"
            >
              {podcast.title}
            </Link>
            <span>·</span>
            <span>{formatDate(episode.publishedAt)}</span>
            {episode.duration ? (
              <>
                <span>·</span>
                <span>{formatDuration(episode.duration)}</span>
              </>
            ) : null}
            {episode.episodeNumber ? (
              <>
                <span>·</span>
                <span>Episode #{episode.episodeNumber}</span>
              </>
            ) : null}
            {episode.videoUrl ? (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Icons.video className="h-3.5 w-3.5" /> Video
                </span>
              </>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
            {episode.title}
          </h1>

          <EpisodePlayer episode={episode} poster={coverImg} />

          <div className="flex flex-wrap gap-2 pt-1">
            {episode.audioUrl ? (
              <a
                href={episode.audioUrl}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                download
              >
                Download audio
              </a>
            ) : null}
            {episode.link ? (
              <a
                href={episode.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Icons.externalLink className="h-3.5 w-3.5" />
                Show notes
              </a>
            ) : null}
            <a
              href={podcast.applePodcastUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <Icons.applePodcasts className="h-3.5 w-3.5" />
              Apple Podcasts
            </a>
            {podcast.spotifyUrl ? (
              <a
                href={podcast.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Icons.spotify className="h-3.5 w-3.5" />
                Spotify
              </a>
            ) : null}
          </div>

          {episode.description ? (
            <div className="prose-neutral mt-6 max-w-3xl">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Show notes
              </h2>
              <div
                className="podcast-html-content mt-3 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: episode.description }}
              />
            </div>
          ) : null}

          <div className="mt-10 grid gap-3 border-t pt-6 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/podcasts/${podcast.id}/${prev.id}/`}
                className="rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  ← Previous
                </p>
                <p className="line-clamp-2 text-sm font-medium">{prev.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/podcasts/${podcast.id}/${next.id}/`}
                className="rounded-lg border p-3 text-right transition-colors hover:bg-accent"
              >
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Next →
                </p>
                <p className="line-clamp-2 text-sm font-medium">{next.title}</p>
              </Link>
            ) : (
              <span />
            )}
          </div>

          {/* Avoid unused */}
          <span className="hidden">{stripHtml(episode.description)}</span>
        </div>
      </div>
    </article>
  )
}
