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

/**
 * Deep link to the "All Reviews" tab on an Apple Podcasts page.
 */
export function appleReviewsPageUrl(applePodcastId: string): string {
  const id = applePodcastId.replace(/^id/, "")
  return `https://podcasts.apple.com/us/podcast/id${id}?see-all=reviews`
}

/**
 * Deterministic Pocket Casts URL derived from an Apple Podcasts ID.
 * Pocket Casts redirects `pca.st/itunes/{id}` to its canonical share page.
 */
export function pocketCastsUrlFor(applePodcastId: string): string {
  const id = applePodcastId.replace(/^id/, "")
  return `https://pca.st/itunes/${id}`
}

/**
 * Deterministic Overcast URL derived from an Apple Podcasts ID.
 * Per overcast.fm/podcasterinfo, URLs take the form `overcast.fm/itunes{id}`
 * (no slash between `itunes` and the ID).
 */
export function overcastUrlFor(applePodcastId: string): string {
  const id = applePodcastId.replace(/^id/, "")
  return `https://overcast.fm/itunes${id}`
}

/**
 * Deterministic Castro URL derived from an Apple Podcasts ID.
 * Castro's own share pages use the form `castro.fm/itunes/{id}`.
 */
export function castroUrlFor(applePodcastId: string): string {
  const id = applePodcastId.replace(/^id/, "")
  return `https://castro.fm/itunes/${id}`
}

export interface AppleAggregateRating {
  averageRating: number | null
  ratingCount: number | null
  scrapedAt: string
}

/**
 * Scrape the public Apple Podcasts page for the aggregate rating + review count.
 *
 * The iTunes Lookup API does NOT return ratings for podcasts (the fields are
 * absent from the response), but the public web page contains a JSON-LD
 * `aggregateRating` block that does. This function fetches the page and
 * extracts that block. Cached for 24h.
 *
 * Returns null on any failure (network error, parse failure, missing block).
 */
export async function appleScrapeAggregateRating(
  applePodcastId: string,
  country = "us"
): Promise<AppleAggregateRating | null> {
  const id = applePodcastId.replace(/^id/, "")
  const cacheKey = `${country}:${id}`
  return withCache<AppleAggregateRating | null>(
    "apple-rating",
    cacheKey,
    async () => {
      const url = `https://podcasts.apple.com/${country}/podcast/id${id}`
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
          redirect: "follow",
        })
        if (!res.ok) return null
        const html = await res.text()
        // The aggregateRating block lives inside a JSON-LD <script> tag. Pull it
        // out with a tolerant regex; the JSON keys appear in a stable order.
        const m = html.match(
          /"aggregateRating":\s*\{\s*"@type":\s*"AggregateRating"\s*,\s*"ratingValue":\s*([0-9.]+)\s*,\s*"reviewCount":\s*([0-9]+)/
        )
        if (!m) return null
        const averageRating = Number(m[1])
        const ratingCount = Number(m[2])
        if (!Number.isFinite(averageRating) || !Number.isFinite(ratingCount)) {
          return null
        }
        return {
          averageRating,
          ratingCount,
          scrapedAt: new Date().toISOString(),
        }
      } catch {
        return null
      }
    },
    { ttlMs: 24 * 60 * 60 * 1000 } // 24h cache
  )
}

export interface AppleReview {
  rating: number
  title: string
  content: string
  author: string
  updatedAt: string
}

/**
 * Fetch the most-recent customer reviews for a podcast from the public iTunes
 * Customer Reviews RSS endpoint (JSON variant).
 *
 * Endpoint:
 *   https://itunes.apple.com/<country>/rss/customerreviews/id=<id>/sortby=mostrecent/json
 *
 * Returns up to `limit` reviews (default 5). Returns [] on any failure.
 * Cached for 24h.
 */
export async function appleFetchRecentReviews(
  applePodcastId: string,
  limit = 5,
  country = "us"
): Promise<AppleReview[]> {
  const id = applePodcastId.replace(/^id/, "")
  const cacheKey = `${country}:${id}:${limit}`
  return withCache<AppleReview[]>(
    "apple-reviews",
    cacheKey,
    async () => {
      const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${id}/sortby=mostrecent/json`
      try {
        const data = await fetchJson<{
          feed?: { entry?: unknown }
        }>(url, 2)
        const entryRaw = data.feed?.entry
        if (!entryRaw) return []
        // The endpoint returns either an object (single review) or an array
        // (multiple). Normalise.
        const entries = Array.isArray(entryRaw) ? entryRaw : [entryRaw]
        // The first entry is sometimes the podcast's own metadata when there
        // are no reviews yet; filter to entries that look like reviews
        // (have im:rating and content).
        const reviews: AppleReview[] = []
        for (const e of entries) {
          if (!e || typeof e !== "object") continue
          const rec = e as Record<string, unknown>
          const ratingLabel = labelOf(rec["im:rating"])
          const titleLabel = labelOf(rec.title)
          const contentLabel = labelOf(rec.content)
          const updatedLabel = labelOf(rec.updated)
          const author = rec.author as Record<string, unknown> | undefined
          const authorLabel = author ? labelOf(author.name) : ""
          const rating = Number(ratingLabel)
          if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue
          if (!contentLabel) continue
          reviews.push({
            rating,
            title: titleLabel || "(no title)",
            content: contentLabel,
            author: authorLabel || "Anonymous",
            updatedAt: updatedLabel || new Date().toISOString(),
          })
          if (reviews.length >= limit) break
        }
        return reviews
      } catch {
        return []
      }
    },
    { ttlMs: 24 * 60 * 60 * 1000 } // 24h cache
  )
}

/**
 * Apple's customer-reviews RSS wraps every value in `{ label: "..." }`.
 * This helper safely extracts the string.
 */
function labelOf(node: unknown): string {
  if (!node || typeof node !== "object") return ""
  const rec = node as Record<string, unknown>
  if (typeof rec.label === "string") return rec.label
  return ""
}
