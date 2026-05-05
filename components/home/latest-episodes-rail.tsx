import Link from "next/link"
import Image from "next/image"

import { formatDate, formatDuration } from "@/lib/utils"
import { stripHtml } from "@/lib/seo"
import type { Episode, Podcast } from "@/types/podcast"

interface LatestEpisodesRailProps {
  episodes: Array<Episode & { podcast: Podcast }>
  limit?: number
}

export function LatestEpisodesRail({
  episodes,
  limit = 20,
}: LatestEpisodesRailProps) {
  const items = episodes.slice(0, limit)
  if (!items.length) return null
  return (
    <aside className="lg:sticky lg:top-20">
      <div className="rounded-xl border bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Latest Episodes</h2>
          <Link
            href="/episodes/"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        <ol className="divide-y max-h-[80vh] overflow-y-auto">
          {items.map((e) => (
            <li key={`${e.podcastId}-${e.id}`}>
              <Link
                href={`/podcasts/${e.podcastId}/${e.id}/`}
                className="flex gap-3 p-3 transition-colors hover:bg-accent"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                  {(e.imageUrl ?? e.podcast.image) ? (
                    <Image
                      src={e.imageUrl ?? e.podcast.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug">
                    {e.title}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {e.podcast.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDate(e.publishedAt)}
                    {e.duration ? ` · ${formatDuration(e.duration)}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}

// Avoid unused import
void stripHtml
