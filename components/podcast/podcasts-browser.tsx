"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import type { Podcast } from "@/types/podcast"
import { displayTag } from "@/lib/utils"
import { buildPodcastIndex, searchPodcasts } from "@/lib/search"
import { bayesianRatingComparator } from "@/lib/ranking"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { PodcastCard } from "@/components/podcast/podcast-card"
import { Icons } from "@/components/icons"

type SortKey = "popular" | "rating" | "reviews" | "updated" | "title"

interface PodcastsBrowserProps {
  podcasts: Podcast[]
  allTags: { tag: string; count: number }[]
}

const SORT_LABELS: Record<SortKey, string> = {
  popular: "Most Popular",
  rating: "Highest Rated",
  reviews: "Most Reviews",
  updated: "Recently Updated",
  title: "A–Z",
}

export function PodcastsBrowser({ podcasts, allTags }: PodcastsBrowserProps) {
  const router = useRouter()
  const params = useSearchParams()

  const [query, setQuery] = useState(params.get("q") ?? "")
  const [selectedTag, setSelectedTag] = useState<string | null>(
    params.get("tag")
  )
  const [showInactive, setShowInactive] = useState(
    params.get("inactive") === "1"
  )
  const [sort, setSort] = useState<SortKey>(
    (params.get("sort") as SortKey) || "popular"
  )
  const [showAllTags, setShowAllTags] = useState(false)

  // Sync state to URL (replace, no history spam)
  useEffect(() => {
    const sp = new URLSearchParams()
    if (query) sp.set("q", query)
    if (selectedTag) sp.set("tag", selectedTag)
    if (showInactive) sp.set("inactive", "1")
    if (sort !== "popular") sp.set("sort", sort)
    const qs = sp.toString()
    router.replace(qs ? `?${qs}` : "?", { scroll: false })
  }, [query, selectedTag, showInactive, sort, router])

  const fuse = useMemo(() => buildPodcastIndex(podcasts), [podcasts])

  const filtered = useMemo(() => {
    let list = podcasts
    if (!showInactive) list = list.filter((p) => p.isActive)
    if (selectedTag) {
      list = list.filter((p) =>
        (p.tags as readonly string[]).includes(selectedTag)
      )
    }
    const hasQuery = query.trim().length > 0
    if (hasQuery) {
      // Rank by Fuse relevance, then intersect with current filters.
      const allowedIds = new Set(list.map((p) => p.id))
      const ranked = searchPodcasts(fuse, query.trim(), 500).filter((p) =>
        allowedIds.has(p.id)
      )
      // When the user is searching, relevance wins over the sort dropdown.
      return ranked
    }
    const sorted = [...list]
    switch (sort) {
      case "rating":
        sorted.sort(bayesianRatingComparator(list))
        break
      case "reviews":
        sorted.sort(
          (a, b) =>
            (b.ratings?.apple?.ratingCount ?? 0) -
            (a.ratings?.apple?.ratingCount ?? 0)
        )
        break
      case "updated":
        sorted.sort((a, b) => {
          const da = a.lastEpisodeDate ? Date.parse(a.lastEpisodeDate) : 0
          const db = b.lastEpisodeDate ? Date.parse(b.lastEpisodeDate) : 0
          return db - da
        })
        break
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "popular":
      default:
        sorted.sort((a, b) => {
          // popularity = log(reviews+1) * rating
          const sa =
            Math.log10((a.ratings?.apple?.ratingCount ?? 0) + 1) *
            (a.ratings?.apple?.averageRating ?? 0)
          const sb =
            Math.log10((b.ratings?.apple?.ratingCount ?? 0) + 1) *
            (b.ratings?.apple?.averageRating ?? 0)
          return sb - sa
        })
    }
    return sorted
  }, [podcasts, query, selectedTag, showInactive, sort, fuse])

  const visibleTags = showAllTags ? allTags : allTags.slice(0, 24)

  const toggleTag = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag))
  }

  const clearAll = () => {
    setQuery("")
    setSelectedTag(null)
    setShowInactive(false)
    setSort("popular")
  }

  const hasFilters =
    query || selectedTag || showInactive || sort !== "popular"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search podcasts, hosts, topics…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="sort"
            className="text-sm font-medium text-muted-foreground"
          >
            Sort:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={showInactive}
            onCheckedChange={(v) => setShowInactive(v === true)}
          />
          <span>Show inactive</span>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {visibleTags.map(({ tag, count }) => {
            const active = selectedTag === tag
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent")
                }
              >
                {displayTag(tag)}
                <span className="opacity-60">{count}</span>
              </button>
            )
          })}
          {allTags.length > 24 && (
            <button
              type="button"
              onClick={() => setShowAllTags((v) => !v)}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              {showAllTags ? "Show less" : `Show all ${allTags.length} tags`}
            </button>
          )}
        </div>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 px-2 text-xs"
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} podcast{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            No podcasts match your filters.
          </p>
          <Button variant="link" onClick={clearAll}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((p) => (
            <PodcastCard key={p.id} podcast={p} />
          ))}
        </div>
      )}
    </div>
  )
}
