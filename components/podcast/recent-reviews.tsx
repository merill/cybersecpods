import Link from "next/link"

import { Icons } from "@/components/icons"
import { cn, formatDate } from "@/lib/utils"
import type { Podcast, PodcastReview } from "@/types/podcast"

interface RecentReviewsProps {
  podcast: Podcast
  variant?: "sidebar" | "mobile"
  className?: string
}

/**
 * 5 most-recent reviews from Apple Podcasts.
 *
 * Two variants:
 * - "sidebar":  always-visible card meant for the right rail at lg+ breakpoints
 * - "mobile":   collapsed <details> element for narrow viewports so episodes
 *               aren't pushed down
 *
 * The page renders BOTH and toggles visibility with responsive classes; this
 * component just chooses its own shell.
 */
export function RecentReviews({
  podcast,
  variant = "sidebar",
  className,
}: RecentReviewsProps) {
  const reviews = podcast.recentReviews
  if (!reviews || reviews.length === 0) return null

  const reviewsAllUrl = appleReviewsPageUrl(podcast.applePodcastId)
  const heading = "Recent reviews on Apple Podcasts"

  if (variant === "mobile") {
    return (
      <details
        className={cn(
          "group rounded-lg border bg-card text-card-foreground",
          className
        )}
      >
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
          <span>
            {heading}{" "}
            <span className="text-muted-foreground">({reviews.length})</span>
          </span>
          <Icons.add className="h-4 w-4 transition-transform group-open:rotate-45" />
        </summary>
        <div className="border-t px-4 py-3">
          <ReviewsList reviews={reviews} />
          <ViewAllLink href={reviewsAllUrl} />
        </div>
      </details>
    )
  }

  // sidebar variant
  return (
    <aside
      className={cn(
        "rounded-lg border bg-card text-card-foreground",
        className
      )}
      aria-label="Recent reviews"
    >
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold leading-tight">{heading}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {reviews.length} most recent
        </p>
      </div>
      <div className="px-4 py-3">
        <ReviewsList reviews={reviews} />
        <ViewAllLink href={reviewsAllUrl} />
      </div>
    </aside>
  )
}

function ReviewsList({ reviews }: { reviews: PodcastReview[] }) {
  return (
    <ul className="space-y-4">
      {reviews.map((r, i) => (
        <li
          key={`${r.author}-${r.updatedAt}-${i}`}
          className="border-b pb-4 last:border-b-0 last:pb-0"
        >
          <Stars value={r.rating} />
          <p className="mt-1 text-sm font-medium leading-snug">{r.title}</p>
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-snug text-muted-foreground">
            {r.content}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{r.author}</span>
            {" · "}
            <time dateTime={r.updatedAt}>{formatDate(r.updatedAt)}</time>
          </p>
        </li>
      ))}
    </ul>
  )
}

function Stars({ value }: { value: number }) {
  // 5 star slots; filled = 1..value
  return (
    <div
      className="flex items-center gap-0.5 text-amber-500"
      aria-label={`Rated ${value} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Icons.star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < value ? "fill-current" : "fill-none stroke-current opacity-40"
          )}
        />
      ))}
    </div>
  )
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      View all reviews on Apple Podcasts
      <Icons.externalLink className="h-3 w-3" />
    </Link>
  )
}

/**
 * Build the deep link to the "All Reviews" tab on an Apple Podcasts page.
 * Mirrors the helper in `@build/lib/apple.ts` so this component stays
 * client/server-rendering safe without importing build code.
 */
function appleReviewsPageUrl(applePodcastId: string): string {
  const id = applePodcastId.replace(/^id/, "")
  return `https://podcasts.apple.com/us/podcast/id${id}?see-all=reviews`
}
