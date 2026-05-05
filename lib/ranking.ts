// Pure ranking helpers. No Node-only imports here so this can be used from
// Client Components (e.g. components/podcast/podcasts-browser.tsx) and from
// server-side data accessors (lib/podcasts.ts) alike.

import type { Podcast } from "@/types/podcast"

// ---------------------------------------------------------------------------
// Bayesian-weighted "true" rating (IMDb-style)
// ---------------------------------------------------------------------------

/**
 *   WR = (v / (v + m)) * R + (m / (v + m)) * C
 *
 *   R = podcast averageRating
 *   v = podcast ratingCount
 *   m = minimum-votes prior (confidence threshold)
 *   C = catalog mean rating
 *
 * Pulls each podcast's rating toward the catalog mean until it has
 * accumulated enough votes to stand on its own. Output is on the same 1-5
 * scale as raw averageRating.
 */
export function bayesianRating(p: Podcast, m: number, C: number): number {
  const R = p.ratings.apple?.averageRating ?? 0
  const v = p.ratings.apple?.ratingCount ?? 0
  if (v <= 0) return C
  return (v / (v + m)) * R + (m / (v + m)) * C
}

/**
 * Compute the Bayesian rating prior for a set of podcasts.
 *   m: minimum-votes threshold. Hard-coded to 50 (~ catalog median).
 *   C: catalog mean rating across rated podcasts.
 */
export function computeRatingPrior(podcasts: Podcast[]): {
  m: number
  C: number
} {
  const rated = podcasts.filter(
    (p) =>
      (p.ratings.apple?.averageRating ?? 0) > 0 &&
      (p.ratings.apple?.ratingCount ?? 0) > 0
  )
  const C =
    rated.length === 0
      ? 4.5
      : rated.reduce(
          (sum, p) => sum + (p.ratings.apple?.averageRating ?? 0),
          0
        ) / rated.length
  return { m: 50, C }
}

/**
 * Returns a comparator that ranks podcasts by Bayesian-weighted rating, with
 * raw vote count as a tie-break. The prior is computed once over `podcasts`,
 * so callers should pass the candidate pool used for filtering.
 */
export function bayesianRatingComparator(
  podcasts: Podcast[]
): (a: Podcast, b: Podcast) => number {
  const { m, C } = computeRatingPrior(podcasts)
  return (a, b) => {
    const sa = bayesianRating(a, m, C)
    const sb = bayesianRating(b, m, C)
    if (sb !== sa) return sb - sa
    const ac = a.ratings.apple?.ratingCount ?? 0
    const bc = b.ratings.apple?.ratingCount ?? 0
    return bc - ac
  }
}

// ---------------------------------------------------------------------------
// Trending score
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000

/** Exponential decay 0..1 on `lastEpisodeDate`. Today => 1, halflife days => 0.5. */
export function recencyBoost(
  iso: string | null,
  halflifeDays = 14
): number {
  if (!iso) return 0
  const ageDays = Math.max(0, (Date.now() - Date.parse(iso)) / DAY_MS)
  return Math.pow(0.5, ageDays / halflifeDays)
}

/**
 * Linear interp on first-episode age. 0-3 months => 1.0, 18+ months => 0.7,
 * linearly interpolated in between. Null => neutral 0.7 (we have no signal).
 */
export function youthBoost(firstEpisodeDate: string | null): number {
  if (!firstEpisodeDate) return 0.7
  const ageDays = (Date.now() - Date.parse(firstEpisodeDate)) / DAY_MS
  if (!Number.isFinite(ageDays) || ageDays <= 90) return 1.0
  if (ageDays >= 540) return 0.7
  // 90..540 days linear from 1.0 down to 0.7
  const t = (ageDays - 90) / (540 - 90)
  return 1.0 - 0.3 * t
}

/** Votes-per-episode normalized to 0..1 against `max`. */
export function votesPerEpisodeNormalized(p: Podcast, max: number): number {
  const v = p.ratings.apple?.ratingCount ?? 0
  const e = Math.max(1, p.episodeCount)
  if (max <= 0) return 0
  return Math.min(v / e / max, 1)
}

export interface TrendingContext {
  m: number // Bayesian prior
  C: number // catalog mean rating
  catalogMaxVPE: number // p90 of votes-per-episode across the candidate pool
}

export function buildTrendingContext(podcasts: Podcast[]): TrendingContext {
  const { m, C } = computeRatingPrior(podcasts)
  const vpes = podcasts
    .map((p) => {
      const v = p.ratings.apple?.ratingCount ?? 0
      return v / Math.max(1, p.episodeCount)
    })
    .filter((x) => x > 0)
    .sort((a, b) => a - b)
  const catalogMaxVPE =
    vpes.length === 0 ? 1 : vpes[Math.min(vpes.length - 1, Math.floor(vpes.length * 0.9))]
  return { m, C, catalogMaxVPE: catalogMaxVPE || 1 }
}

/**
 * Composite trending score. Base = bayesian rating; modulated by smallness,
 * youth, liveness, and engagement. Each modulation is bounded so a missing
 * signal can't collapse the score.
 */
export function trendingScore(
  p: Podcast,
  ctx: TrendingContext
): number {
  const base = bayesianRating(p, ctx.m, ctx.C)
  const v = p.ratings.apple?.ratingCount ?? 0
  const smallness = 1 - Math.min(v / 1000, 1) // 0..1
  const youth = youthBoost(p.firstEpisodeDate)
  const liveness = recencyBoost(p.lastEpisodeDate, 14)
  const engagement = votesPerEpisodeNormalized(p, ctx.catalogMaxVPE)
  return (
    base *
    (0.4 + 0.6 * smallness) *
    (0.7 + 0.3 * youth) *
    (0.5 + 0.5 * liveness) *
    (0.8 + 0.2 * engagement)
  )
}
