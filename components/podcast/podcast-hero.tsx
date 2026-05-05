import Image from "next/image"
import Link from "next/link"

import type { Podcast } from "@/types/podcast"
import { cn, displayTag, formatDate, formatRelative } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { InactiveBadge } from "@/components/podcast/inactive-badge"
import { RatingBadge } from "@/components/podcast/rating-badge"

interface PodcastHeroProps {
  podcast: Podcast
}

export function PodcastHero({ podcast }: PodcastHeroProps) {
  const links: Array<{
    href: string | null | undefined
    label: string
    icon: React.ElementType
  }> = [
    { href: podcast.applePodcastUrl, label: "Apple", icon: Icons.applePodcasts },
    { href: podcast.spotifyUrl, label: "Spotify", icon: Icons.spotify },
    { href: podcast.youtubeUrl, label: "YouTube", icon: Icons.youtube },
    { href: podcast.rssUrl, label: "RSS", icon: Icons.rss },
    { href: podcast.websiteUrl, label: "Website", icon: Icons.globe },
    { href: podcast.twitterUrl, label: "X", icon: Icons.x },
    { href: podcast.linkedinUrl, label: "LinkedIn", icon: Icons.linkedin },
  ]

  return (
    <div className="relative overflow-hidden border-b">
      {podcast.image ? (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-30 blur-3xl"
          style={{ backgroundImage: `url(${podcast.image})` }}
          aria-hidden
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/80 to-background" />

      <div className="container py-10 md:py-14">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/podcasts/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Icons.arrowLeft className="h-4 w-4" />
            All podcasts
          </Link>
          <Link
            href={`/submit/?slug=${podcast.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Icons.edit className="h-3.5 w-3.5" />
            Suggest edits
          </Link>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
          <div className="relative aspect-square w-40 shrink-0 overflow-hidden rounded-2xl border bg-muted shadow-xl md:w-56">
            {podcast.image ? (
              <Image
                src={podcast.image}
                alt={podcast.title}
                fill
                sizes="(min-width: 768px) 224px, 160px"
                className="object-cover"
                priority
              />
            ) : null}
            {podcast.hasVideo ? (
              <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
                <Icons.video className="h-3 w-3" />
                Video
              </div>
            ) : null}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {!podcast.isActive ? <InactiveBadge /> : null}
              {podcast.featured ? <Badge variant="default">Featured</Badge> : null}
              <RatingBadge ratings={podcast.ratings} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              {podcast.title}
            </h1>
            {podcast.author ? (
              <p className="text-base text-muted-foreground md:text-lg">
                by {podcast.author}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Icons.calendar className="h-4 w-4" />
                {podcast.episodeCount} episode
                {podcast.episodeCount === 1 ? "" : "s"}
              </span>
              {podcast.lastEpisodeDate ? (
                <span className="inline-flex items-center gap-1">
                  <Icons.clock className="h-4 w-4" />
                  Latest {formatRelative(podcast.lastEpisodeDate)}
                </span>
              ) : null}
              {podcast.language ? <span>{podcast.language.toUpperCase()}</span> : null}
            </div>

            {podcast.tags.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {podcast.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/categories/${t}/`}
                    className="rounded-full border bg-background/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {displayTag(t)}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-3">
              {links
                .filter((l) => !!l.href)
                .map((l) => {
                  const Icon = l.icon
                  return (
                    <a
                      key={l.label}
                      href={l.href!}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium",
                        "transition-colors hover:bg-accent"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {l.label}
                    </a>
                  )
                })}
            </div>
          </div>
        </div>

        {podcast.summary || podcast.description ? (
          <div
            className="podcast-html-content mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: podcast.description || podcast.summary,
            }}
          />
        ) : null}

        {podcast.authors?.length ? (
          <div className="mt-6 max-w-3xl">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hosts
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {podcast.authors.map((a) => (
                <li
                  key={a.name}
                  className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs"
                >
                  <span className="font-medium">{a.name}</span>
                  {a.twitterUrl ? (
                    <a
                      href={a.twitterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`${a.name} on X`}
                    >
                      <Icons.x className="h-3 w-3" />
                    </a>
                  ) : null}
                  {a.linkedinUrl ? (
                    <a
                      href={a.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`${a.name} on LinkedIn`}
                    >
                      <Icons.linkedin className="h-3 w-3" />
                    </a>
                  ) : null}
                  {a.websiteUrl ? (
                    <a
                      href={a.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`${a.name} website`}
                    >
                      <Icons.globe className="h-3 w-3" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {podcast.copyright ? (
          <p className="mt-6 text-xs text-muted-foreground">
            {podcast.copyright}
          </p>
        ) : null}

        {/* Avoid unused */}
        <span className="hidden">{formatDate(podcast.lastEpisodeDate)}</span>
      </div>
    </div>
  )
}
