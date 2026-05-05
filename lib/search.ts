import Fuse from "fuse.js"
import type { Podcast } from "@/types/podcast"

export function buildPodcastIndex(podcasts: Podcast[]): Fuse<Podcast> {
  return new Fuse(podcasts, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: "title", weight: 3 },
      { name: "author", weight: 2 },
      { name: "subtitle", weight: 1.5 },
      { name: "description", weight: 1 },
      { name: "tags", weight: 2 },
      { name: "categories", weight: 1 },
    ],
  })
}

export function searchPodcasts(
  index: Fuse<Podcast>,
  query: string,
  limit = 50
): Podcast[] {
  const q = query.trim()
  if (!q) return []
  return index.search(q, { limit }).map((r) => r.item)
}
