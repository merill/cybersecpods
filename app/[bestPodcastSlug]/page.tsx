import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { siteConfig } from "@/config/site"
import { categoryLabel } from "@/lib/categories"
import {
  BEST_PODCAST_PAGES,
  bestPodcastPageMetadata,
  getBestPodcastPage,
  getRankedPodcastsForPage,
} from "@/lib/editorial-seo"
import { itemListJsonLd, stripHtml } from "@/lib/seo"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { RatingBadge } from "@/components/podcast/rating-badge"

interface PageProps {
  params: { bestPodcastSlug: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  return BEST_PODCAST_PAGES.map((page) => ({
    bestPodcastSlug: page.slug,
  }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const page = getBestPodcastPage(params.bestPodcastSlug)
  if (!page) return {}
  return bestPodcastPageMetadata(page)
}

export default function BestPodcastPage({ params }: PageProps) {
  const page = getBestPodcastPage(params.bestPodcastSlug)
  if (!page) notFound()

  const podcasts = getRankedPodcastsForPage(page, 20)
  const url = `${siteConfig.url}/${page.slug}/`
  const ld = itemListJsonLd(page.title, url, podcasts)

  return (
    <article className="container py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cybersecurity podcast rankings
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
          {page.h1}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{page.description}</p>
      </header>

      <section className="mt-8 grid gap-6 border-y py-6 md:grid-cols-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            How this list is ranked
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Rankings combine Apple Podcasts ratings, review volume, recent
            publishing activity, episode depth, and topical fit.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Best for
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {page.audience}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Updated
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This page refreshes from the CyberSecPods directory whenever podcast
            ratings or episode data are updated.
          </p>
        </div>
      </section>

      <div className="mt-8 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
        <p>{page.intro}</p>
        <p>
          The goal is not to crown a single universal winner. A CISO looking for
          board-level risk conversations, a SOC analyst tracking active threats,
          and an engineer learning AppSec all need different shows. Each entry
          below includes quick context so you can decide whether it belongs in
          your listening rotation.
        </p>
      </div>

      <ol className="mt-10 space-y-5">
        {podcasts.map((podcast, index) => {
          const description = stripHtml(
            podcast.subtitle || podcast.summary || podcast.description
          )
          return (
            <li key={podcast.id} className="rounded-lg border bg-card/50 p-4">
              <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
                <Link
                  href={`/podcasts/${podcast.id}/`}
                  className="relative block aspect-square overflow-hidden rounded-md bg-muted"
                >
                  {podcast.image ? (
                    <Image
                      src={podcast.image}
                      alt={podcast.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      #{index + 1}
                    </span>
                    <RatingBadge ratings={podcast.ratings} size="sm" />
                    {podcast.lastEpisodeDate ? (
                      <span className="text-xs text-muted-foreground">
                        Updated {formatDate(podcast.lastEpisodeDate)}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    <Link
                      href={`/podcasts/${podcast.id}/`}
                      className="hover:text-primary"
                    >
                      {podcast.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {podcast.author}
                  </p>
                  {description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {podcast.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {categoryLabel(tag)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <section className="mt-10 rounded-lg border bg-card/50 p-5">
        <h2 className="text-lg font-semibold tracking-tight">
          What to listen to next
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          For a broader view, browse the full{" "}
          <Link href="/podcasts/" className="font-medium underline">
            cybersecurity podcast directory
          </Link>
          , scan the{" "}
          <Link href="/episodes/" className="font-medium underline">
            latest episodes
          </Link>
          , or explore topic-specific{" "}
          <Link href="/categories/" className="font-medium underline">
            podcast categories
          </Link>
          .
        </p>
      </section>
    </article>
  )
}
