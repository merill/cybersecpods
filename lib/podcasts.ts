import fs from "node:fs"
import path from "node:path"
import type { Podcast, Episode } from "@/types/podcast"
import { CATEGORY_GROUPS, type CategorySlug } from "@/lib/categories"
import {
  bayesianRating,
  buildTrendingContext,
  computeRatingPrior,
  trendingScore,
} from "@/lib/ranking"

export {
  bayesianRating,
  bayesianRatingComparator,
  computeRatingPrior,
} from "@/lib/ranking"

const DATA_DIR = path.join(process.cwd(), "@data")
const PODCASTS_FILE = path.join(DATA_DIR, "podcasts.json")
const EPISODES_DIR = path.join(DATA_DIR, "episodes")

let _podcastsCache: Podcast[] | null = null
const _episodesCache = new Map<string, Episode[]>()

export function getAllPodcasts(): Podcast[] {
  if (_podcastsCache) return _podcastsCache
  if (!fs.existsSync(PODCASTS_FILE)) return []
  const raw = fs.readFileSync(PODCASTS_FILE, "utf8")
  _podcastsCache = JSON.parse(raw) as Podcast[]
  return _podcastsCache
}

export function getActivePodcasts(): Podcast[] {
  return getAllPodcasts().filter((p) => p.isActive)
}

export function getPodcastById(id: string): Podcast | null {
  return getAllPodcasts().find((p) => p.id === id) ?? null
}

export function getEpisodesForPodcast(podcastId: string): Episode[] {
  if (_episodesCache.has(podcastId)) return _episodesCache.get(podcastId)!
  const file = path.join(EPISODES_DIR, `${podcastId}.json`)
  if (!fs.existsSync(file)) return []
  const eps = JSON.parse(fs.readFileSync(file, "utf8")) as Episode[]
  _episodesCache.set(podcastId, eps)
  return eps
}

export function getEpisode(
  podcastId: string,
  episodeId: string
): Episode | null {
  const eps = getEpisodesForPodcast(podcastId)
  return eps.find((e) => e.id === episodeId) ?? null
}

export function getAllTags(): string[] {
  const set = new Set<string>()
  for (const p of getAllPodcasts()) {
    for (const t of p.tags) set.add(t)
  }
  return Array.from(set).sort()
}

/** Alias of getAllTags using canonical naming. */
export function getAllCategories(): CategorySlug[] {
  return getAllTags() as CategorySlug[]
}

export function getPodcastsByTag(tag: string): Podcast[] {
  return getAllPodcasts().filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}

/** Alias of getPodcastsByTag using canonical naming. */
export const getPodcastsByCategory = getPodcastsByTag

/**
 * Returns the latest episodes across all podcasts, newest first.
 * `limit` defaults to 50.
 */
export function getLatestEpisodes(
  limit = 50,
  opts: { includeInactive?: boolean } = {}
): Array<Episode & { podcast: Podcast }> {
  const { includeInactive = false } = opts
  const podcasts = includeInactive ? getAllPodcasts() : getActivePodcasts()
  const podcastById = new Map(podcasts.map((p) => [p.id, p]))
  const all: Array<Episode & { podcast: Podcast }> = []
  for (const p of podcasts) {
    // Include only the most recent N per podcast to keep this fast
    const eps = getEpisodesForPodcast(p.id).slice(0, 20)
    for (const e of eps) {
      if (!e.publishedAt) continue
      const podcast = podcastById.get(e.podcastId)
      if (!podcast) continue
      all.push({ ...e, podcast })
    }
  }
  all.sort((a, b) => {
    const ta = new Date(a.publishedAt).getTime() || 0
    const tb = new Date(b.publishedAt).getTime() || 0
    return tb - ta
  })
  return all.slice(0, limit)
}

/**
 * Deterministic random shuffle so static builds are stable per build.
 * Uses BUILD_SEED env var when present.
 */
function getSeed(): number {
  const env = process.env.BUILD_SEED
  if (env) {
    let h = 0
    for (let i = 0; i < env.length; i++) h = (h * 31 + env.charCodeAt(i)) | 0
    return h >>> 0
  }
  // Use current hour as seed so featured set rotates with hourly rebuilds
  return Math.floor(Date.now() / 3_600_000)
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffleSeeded<T>(arr: T[], seed: number = getSeed()): T[] {
  const rand = mulberry32(seed)
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function getFeaturedPodcasts(count = 3): Podcast[] {
  const all = getActivePodcasts()
  const manual = all.filter((p) => p.featured)
  if (manual.length >= count) return shuffleSeeded(manual).slice(0, count)
  const remaining = shuffleSeeded(all.filter((p) => !p.featured))
  return [...manual, ...remaining].slice(0, count)
}

// ---------------------------------------------------------------------------
// Ranking helpers (Bayesian prior + Top Rated)
// ---------------------------------------------------------------------------

export function getTopRatedPodcasts(count = 12): Podcast[] {
  const active = getActivePodcasts()
  const { m, C } = computeRatingPrior(active)
  return active
    .filter(
      (p) =>
        (p.ratings.apple?.averageRating ?? 0) > 0 &&
        (p.ratings.apple?.ratingCount ?? 0) > 0
    )
    .map((p) => ({ p, score: bayesianRating(p, m, C) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      // Tie-break on raw vote count so larger audiences win equal smoothed scores.
      const ac = a.p.ratings.apple?.ratingCount ?? 0
      const bc = b.p.ratings.apple?.ratingCount ?? 0
      return bc - ac
    })
    .slice(0, count)
    .map(({ p }) => p)
}

// ---------------------------------------------------------------------------
// Trending: smaller, younger, high-quality shows
// ---------------------------------------------------------------------------

/**
 * Returns active podcasts ranked by composite trending score. Excludes shows
 * already shown in Top Rated and Most Reviewed so this row stays distinct.
 *
 * Eligibility: ratingCount >= 3, OR episodeCount >= 5 with a fresh
 * lastEpisodeDate (within 60 days). This lets brand-new shows surface even
 * before they've accumulated reviews.
 *
 * Scoring is multiplicative around the Bayesian rating: smallness, youth,
 * liveness, and engagement only modulate, never zero out. A small hourly-
 * seeded jitter keeps the row alive across rebuilds.
 */
export function getTrendingPodcasts(count = 20): Podcast[] {
  const active = getActivePodcasts()
  const topRatedIds = new Set(getTopRatedPodcasts(20).map((p) => p.id))
  const mostReviewedIds = new Set(
    getMostReviewedPodcasts(20).map((p) => p.id)
  )
  const FRESH_MS = 60 * 86_400_000
  const eligible = active.filter((p) => {
    if (topRatedIds.has(p.id)) return false
    if (mostReviewedIds.has(p.id)) return false
    const v = p.ratings.apple?.ratingCount ?? 0
    if (v >= 3) return true
    if (p.episodeCount >= 5 && p.lastEpisodeDate) {
      const age = Date.now() - Date.parse(p.lastEpisodeDate)
      if (Number.isFinite(age) && age <= FRESH_MS) return true
    }
    return false
  })
  if (eligible.length === 0) return []
  const ctx = buildTrendingContext(eligible)
  // Hourly jitter ±2% so order refreshes in lockstep with cron-driven rebuilds.
  const rand = mulberry32(getSeed())
  const scored = eligible.map((p) => {
    const base = trendingScore(p, ctx)
    const jitter = 1 + (rand() - 0.5) * 0.04
    return { p, score: base * jitter }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, count).map(({ p }) => p)
}

export function getMostReviewedPodcasts(count = 12): Podcast[] {
  return getActivePodcasts()
    .filter((p) => (p.ratings.apple?.ratingCount ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.ratings.apple?.ratingCount ?? 0) -
        (a.ratings.apple?.ratingCount ?? 0)
    )
    .slice(0, count)
}

export function getRecentlyUpdatedPodcasts(count = 12): Podcast[] {
  return getActivePodcasts()
    .filter((p) => p.lastEpisodeDate)
    .sort(
      (a, b) =>
        new Date(b.lastEpisodeDate!).getTime() -
        new Date(a.lastEpisodeDate!).getTime()
    )
    .slice(0, count)
}

export interface TagCount {
  tag: string
  count: number
}

export function getPopularTags(min = 2): TagCount[] {
  const counts = new Map<string, number>()
  for (const p of getActivePodcasts()) {
    for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .filter(([, n]) => n >= min)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

/**
 * Returns counts for every canonical category, including zero-count ones.
 * Used by the /categories/ landing page.
 */
export interface CategoryCount {
  slug: CategorySlug
  count: number
}

export function getCategoryCounts(
  opts: { activeOnly?: boolean } = {}
): CategoryCount[] {
  const { activeOnly = true } = opts
  const counts = new Map<string, number>()
  const podcasts = activeOnly ? getActivePodcasts() : getAllPodcasts()
  for (const p of podcasts) {
    for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return CATEGORY_GROUPS.flatMap((g) => g.categories).map((slug) => ({
    slug: slug as CategorySlug,
    count: counts.get(slug) ?? 0,
  }))
}

export function formatTag(tag: string): string {
  return tag
    .split("-")
    .map((s) => (s.length <= 3 ? s.toUpperCase() : s.charAt(0).toUpperCase() + s.slice(1)))
    .join(" ")
}
