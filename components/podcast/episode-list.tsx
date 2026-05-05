"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import type { Episode, Podcast } from "@/types/podcast"
import { formatDate, formatDuration } from "@/lib/utils"
import { stripHtml } from "@/lib/seo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"

interface EpisodeListProps {
  podcast: Podcast
  episodes: Episode[]
  /** Number of recent episodes that have full statically-generated pages. */
  staticLimit?: number
  pageSize?: number
}

export function EpisodeList({
  podcast,
  episodes,
  staticLimit = 25,
  pageSize = 25,
}: EpisodeListProps) {
  const [query, setQuery] = useState("")
  const [visible, setVisible] = useState(pageSize)

  // Episodes are passed in newest-first; first N have static pages.
  const staticIds = useMemo(
    () => new Set(episodes.slice(0, staticLimit).map((e) => e.id)),
    [episodes, staticLimit]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return episodes
    return episodes.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        stripHtml(e.description ?? "")
          .toLowerCase()
          .includes(q)
    )
  }, [episodes, query])

  const items = filtered.slice(0, visible)

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">
          Episodes{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({filtered.length})
          </span>
        </h2>
        <div className="relative md:w-72">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setVisible(pageSize)
            }}
            placeholder="Search episodes…"
            className="pl-9"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          No episodes match your search.
        </p>
      ) : (
        <ol className="divide-y rounded-xl border bg-card/50">
          {items.map((e) => {
            const img = e.imageUrl ?? podcast.image
            const desc = stripHtml(e.description ?? "").slice(0, 220)
            const hasStaticPage = staticIds.has(e.id)
            const internalHref = `/podcasts/${podcast.id}/${e.id}/`
            const externalHref = e.link || e.audioUrl || podcast.applePodcastUrl
            const Comp: React.ElementType = hasStaticPage ? Link : "a"
            const linkProps: Record<string, unknown> = hasStaticPage
              ? { href: internalHref }
              : {
                  href: externalHref,
                  target: "_blank",
                  rel: "noreferrer",
                }
            return (
              <li key={e.id}>
                <Comp
                  {...linkProps}
                  className="group flex gap-4 p-4 transition-colors hover:bg-accent"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted md:h-20 md:w-20">
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/40">
                      <div className="rounded-full bg-white/90 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {e.videoUrl ? (
                          <Icons.video className="h-4 w-4 text-black" />
                        ) : (
                          <Icons.play className="h-4 w-4 fill-black text-black" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-medium leading-snug group-hover:text-primary">
                        {e.title}
                      </h3>
                      {!hasStaticPage ? (
                        <Icons.externalLink
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-label="Opens on publisher's site"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{formatDate(e.publishedAt)}</span>
                      {e.duration ? (
                        <span>{formatDuration(e.duration)}</span>
                      ) : null}
                      {e.episodeNumber ? <span>#{e.episodeNumber}</span> : null}
                      {e.videoUrl ? (
                        <span className="inline-flex items-center gap-1">
                          <Icons.video className="h-3 w-3" />
                          Video
                        </span>
                      ) : null}
                    </p>
                    {desc ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {desc}
                      </p>
                    ) : null}
                  </div>
                </Comp>
              </li>
            )
          })}
        </ol>
      )}

      {visible < filtered.length ? (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setVisible((v) => v + pageSize)}
          >
            Load {Math.min(pageSize, filtered.length - visible)} more
          </Button>
        </div>
      ) : null}
    </div>
  )
}
