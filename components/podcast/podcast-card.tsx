import Image from "next/image"
import Link from "next/link"

import { cn, displayTag } from "@/lib/utils"
import type { Podcast } from "@/types/podcast"
import { Badge } from "@/components/ui/badge"
import { RatingBadge } from "@/components/podcast/rating-badge"
import { InactiveBadge } from "@/components/podcast/inactive-badge"

interface PodcastCardProps {
  podcast: Podcast
  className?: string
  variant?: "default" | "compact"
}

export function PodcastCard({
  podcast,
  className,
  variant = "default",
}: PodcastCardProps) {
  const compact = variant === "compact"
  return (
    <Link
      href={`/podcasts/${podcast.id}/`}
      className={cn(
        "group block overflow-hidden rounded-lg",
        className
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {podcast.image ? (
          <Image
            src={podcast.image}
            alt={podcast.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {!podcast.isActive ? (
          <div className="absolute right-2 top-2">
            <InactiveBadge />
          </div>
        ) : null}
        {podcast.hasVideo ? (
          <div className="absolute left-2 top-2">
            <Badge className="bg-red-600/90 text-white hover:bg-red-600/90">
              Video
            </Badge>
          </div>
        ) : null}
      </div>
      <div className={cn("mt-3 space-y-1", compact && "mt-2")}>
        <h3 className={cn("line-clamp-2 font-semibold leading-tight", compact ? "text-sm" : "text-base")}>
          {podcast.title}
        </h3>
        <p className={cn("line-clamp-1 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {podcast.author}
        </p>
        {!compact && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <RatingBadge ratings={podcast.ratings} size="sm" />
            {podcast.tags.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] font-normal">
                {displayTag(t)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
