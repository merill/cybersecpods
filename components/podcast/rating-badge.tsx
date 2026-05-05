import { Star } from "lucide-react"

import { cn, formatRatingCount } from "@/lib/utils"
import type { Ratings } from "@/types/podcast"

interface RatingBadgeProps {
  ratings: Ratings
  size?: "sm" | "md"
  className?: string
}

export function RatingBadge({ ratings, size = "md", className }: RatingBadgeProps) {
  const apple = ratings.apple
  if (!apple || apple.averageRating == null) return null
  // Apple returns 0/0 for shows with no ratings yet — hide the badge in that case.
  if (!apple.ratingCount || apple.averageRating <= 0) return null
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground",
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        className
      )}
      title={`Apple Podcasts: ${apple.averageRating?.toFixed(1)} from ${apple.ratingCount ?? 0} ratings`}
    >
      <Star className={cn("h-3 w-3 fill-current", size === "sm" && "h-2.5 w-2.5")} />
      <span>{apple.averageRating.toFixed(1)}</span>
      {apple.ratingCount ? (
        <span className="text-muted-foreground">
          ({formatRatingCount(apple.ratingCount)})
        </span>
      ) : null}
    </div>
  )
}
