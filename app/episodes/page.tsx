import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

import { siteConfig } from "@/config/site"
import { getLatestEpisodes } from "@/lib/podcasts"
import { stripHtml } from "@/lib/seo"
import { formatDate, formatDuration } from "@/lib/utils"
import { Icons } from "@/components/icons"

export const metadata: Metadata = {
  title: "Latest Cybersecurity Podcast Episodes",
  description:
    "The latest episodes from across the cybersecurity podcast directory — fresh shows on threat intel, identity, cloud, hacking, and more.",
  alternates: { canonical: siteConfig.url + "/episodes/" },
  openGraph: {
    title: `Latest Episodes | ${siteConfig.name}`,
    description:
      "Latest cybersecurity podcast episodes across the directory.",
    url: siteConfig.url + "/episodes/",
    type: "website",
  },
}

export default function EpisodesIndexPage() {
  const episodes = getLatestEpisodes(120)

  return (
    <div className="container py-8 md:py-12">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Latest Episodes
        </h1>
        <p className="mt-2 text-muted-foreground">
          The freshest {episodes.length} episodes across all cybersecurity
          podcasts in the directory.
        </p>
      </header>

      <ol className="divide-y rounded-xl border bg-card/50">
        {episodes.map((e) => {
          const img = e.imageUrl ?? e.podcast.image
          const desc = stripHtml(e.description ?? "").slice(0, 220)
          return (
            <li key={`${e.podcastId}-${e.id}`}>
              <Link
                href={`/podcasts/${e.podcastId}/${e.id}/`}
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
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {e.podcast.title}
                  </p>
                  <h2 className="mt-0.5 line-clamp-2 font-medium leading-snug group-hover:text-primary">
                    {e.title}
                  </h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{formatDate(e.publishedAt)}</span>
                    {e.duration ? (
                      <span>{formatDuration(e.duration)}</span>
                    ) : null}
                    {e.videoUrl ? (
                      <span className="inline-flex items-center gap-1">
                        <Icons.video className="h-3 w-3" /> Video
                      </span>
                    ) : null}
                  </p>
                  {desc ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {desc}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          )
        })}
      </ol>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Want every episode? Subscribe to the{" "}
        <Link href="/rss.xml" className="font-medium underline">
          combined RSS feed
        </Link>
        .
      </p>
    </div>
  )
}
