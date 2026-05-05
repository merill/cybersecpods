import { withCache } from "./cache.js"

export interface AppleLookupResult {
  collectionId: number
  collectionName: string
  artistName: string
  feedUrl: string | null
  artworkUrl600: string | null
  artworkUrl100: string | null
  primaryGenreName: string | null
  genres: string[]
  trackCount: number | null
  releaseDate: string | null
  averageUserRating: number | null
  userRatingCount: number | null
  collectionViewUrl: string | null
  country: string | null
}

const UA =
  "Mozilla/5.0 (compatible; CyberSecPodsBot/1.0; +https://cybersecpods.com)"

async function fetchJson<T>(url: string, retries = 3): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } })
      if (res.status === 429) {
        const wait = Math.min(8000, 1500 * Math.pow(2, attempt))
        await new Promise((r) => setTimeout(r, wait))
        lastErr = new Error(`HTTP 429 for ${url}`)
        continue
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`)
      }
      return (await res.json()) as T
    } catch (e) {
      lastErr = e
      if (attempt === retries) break
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

/**
 * iTunes Lookup API: https://itunes.apple.com/lookup?id=...&country=us
 * Returns null if no result.
 */
export async function appleLookup(
  applePodcastId: string,
  country = "us"
): Promise<AppleLookupResult | null> {
  const id = applePodcastId.replace(/^id/, "")
  const cacheKey = `${country}:${id}`
  return withCache<AppleLookupResult | null>(
    "apple-lookup",
    cacheKey,
    async () => {
      const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(
        id
      )}&country=${country}&entity=podcast`
      const data = await fetchJson<{
        resultCount: number
        results: Array<Record<string, unknown>>
      }>(url)
      if (!data.resultCount || !data.results.length) return null
      const r = data.results.find(
        (x) => (x as { kind?: string; wrapperType?: string }).kind === "podcast" || (x as { wrapperType?: string }).wrapperType === "track"
      ) ?? data.results[0]
      return {
        collectionId: Number(r.collectionId ?? r.trackId),
        collectionName: String(r.collectionName ?? ""),
        artistName: String(r.artistName ?? ""),
        feedUrl: (r.feedUrl as string) ?? null,
        artworkUrl600: (r.artworkUrl600 as string) ?? null,
        artworkUrl100: (r.artworkUrl100 as string) ?? null,
        primaryGenreName: (r.primaryGenreName as string) ?? null,
        genres: (r.genres as string[]) ?? [],
        trackCount: (r.trackCount as number) ?? null,
        releaseDate: (r.releaseDate as string) ?? null,
        averageUserRating:
          typeof r.averageUserRating === "number"
            ? (r.averageUserRating as number)
            : typeof r.averageUserRatingForCurrentVersion === "number"
            ? (r.averageUserRatingForCurrentVersion as number)
            : null,
        userRatingCount:
          typeof r.userRatingCount === "number"
            ? (r.userRatingCount as number)
            : typeof r.userRatingCountForCurrentVersion === "number"
            ? (r.userRatingCountForCurrentVersion as number)
            : null,
        collectionViewUrl: (r.collectionViewUrl as string) ?? null,
        country,
      }
    },
    { ttlMs: 6 * 60 * 60 * 1000 } // 6h cache for lookups
  )
}

/**
 * Search the iTunes podcast directory by term. Returns up to 50 results.
 */
export async function appleSearch(
  term: string,
  country = "us",
  limit = 50
): Promise<AppleLookupResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    term
  )}&country=${country}&media=podcast&limit=${limit}`
  const data = await fetchJson<{
    resultCount: number
    results: Array<Record<string, unknown>>
  }>(url)
  return (data.results ?? []).map((r) => ({
    collectionId: Number(r.collectionId ?? r.trackId),
    collectionName: String(r.collectionName ?? ""),
    artistName: String(r.artistName ?? ""),
    feedUrl: (r.feedUrl as string) ?? null,
    artworkUrl600: (r.artworkUrl600 as string) ?? null,
    artworkUrl100: (r.artworkUrl100 as string) ?? null,
    primaryGenreName: (r.primaryGenreName as string) ?? null,
    genres: (r.genres as string[]) ?? [],
    trackCount: (r.trackCount as number) ?? null,
    releaseDate: (r.releaseDate as string) ?? null,
    averageUserRating:
      typeof r.averageUserRating === "number"
        ? (r.averageUserRating as number)
        : null,
    userRatingCount:
      typeof r.userRatingCount === "number" ? (r.userRatingCount as number) : null,
    collectionViewUrl: (r.collectionViewUrl as string) ?? null,
    country,
  }))
}

export function applePodcastUrlFor(applePodcastId: string): string {
  const id = applePodcastId.replace(/^id/, "")
  return `https://podcasts.apple.com/podcast/id${id}`
}
