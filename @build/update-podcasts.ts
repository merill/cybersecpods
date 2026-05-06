import fs from "node:fs"
import path from "node:path"
import { podcastInputSchema } from "./lib/zod-schemas.js"
import {
  appleLookup,
  applePodcastUrlFor,
  appleScrapeAggregateRating,
  appleFetchRecentReviews,
  type AppleReview,
} from "./lib/apple.js"
import { fetchAndParseRss, slugify, closeBrowser } from "./lib/rss.js"
import { normalizeSpotifyUrl } from "./lib/spotify.js"
import type { Podcast, Episode, PodcastInput } from "../types/podcast"

const ROOT = process.cwd()
const PODCASTS_DIR = path.join(ROOT, "@data", "podcasts")
const OUTPUT_PODCASTS = path.join(ROOT, "@data", "podcasts.json")
const OUTPUT_EPISODES_DIR = path.join(ROOT, "@data", "episodes")
const RATINGS_FILE = path.join(ROOT, "@data", "ratings.json")
const REVIEWS_FILE = path.join(ROOT, "@data", "reviews.json")

const INACTIVE_THRESHOLD_DAYS = 60

interface ExistingRatings {
  [podcastId: string]: {
    apple?: { averageRating: number | null; ratingCount: number | null; fetchedAt: string }
  }
}

interface ExistingReviews {
  [podcastId: string]: AppleReview[]
}

function loadExistingRatings(): ExistingRatings {
  if (!fs.existsSync(RATINGS_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(RATINGS_FILE, "utf8")) as ExistingRatings
  } catch {
    return {}
  }
}

function loadExistingReviews(): ExistingReviews {
  if (!fs.existsSync(REVIEWS_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8")) as ExistingReviews
  } catch {
    return {}
  }
}

function loadExistingPodcasts(): Map<string, Podcast> {
  const map = new Map<string, Podcast>()
  if (!fs.existsSync(OUTPUT_PODCASTS)) return map
  try {
    const list = JSON.parse(fs.readFileSync(OUTPUT_PODCASTS, "utf8")) as Podcast[]
    for (const p of list) map.set(p.id, p)
  } catch {
    // ignore — fresh build
  }
  return map
}

function loadExistingEpisodes(podcastId: string): Episode[] {
  const file = path.join(OUTPUT_EPISODES_DIR, `${podcastId}.json`)
  if (!fs.existsSync(file)) return []
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Episode[]
  } catch {
    return []
  }
}

function isActiveBy(date: Date | null): boolean {
  if (!date) return false
  const ageMs = Date.now() - date.getTime()
  return ageMs <= INACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
}

function safeDate(s: string): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Returns the previous hydrated record for a podcast id, allowing the cron to
 * preserve last-known-good data when an upstream RSS fetch fails (e.g.
 * transient 5xx, Cloudflare bot-management 403s on Substack from CI runners).
 *
 * If the show has never been hydrated, returns the same null shape as a
 * normal failure so it stays out of the catalog.
 */
function staleFallback(
  id: string,
  existing: Map<string, Podcast>,
  reason: string
): { podcast: Podcast | null; episodes: Episode[] } {
  const prev = existing.get(id)
  if (!prev) return { podcast: null, episodes: [] }
  console.error(
    `  ↪ ${id}: keeping last-known-good record (${reason}, lastEpisodeDate=${prev.lastEpisodeDate ?? "?"})`
  )
  // Re-evaluate active flag against the staled lastEpisodeDate so a long
  // outage still flips the show to inactive after 60 days.
  const last = prev.lastEpisodeDate ? safeDate(prev.lastEpisodeDate) : null
  return {
    podcast: { ...prev, isActive: isActiveBy(last) },
    episodes: loadExistingEpisodes(id),
  }
}

async function processOne(
  file: string,
  ratings: ExistingRatings,
  reviews: ExistingReviews,
  existingPodcasts: Map<string, Podcast>
): Promise<{ podcast: Podcast | null; episodes: Episode[] }> {
  const id = path.basename(file, ".json")
  const raw = fs.readFileSync(file, "utf8")
  const json = JSON.parse(raw)
  const parsed = podcastInputSchema.safeParse(json)
  if (!parsed.success) {
    console.error(`✗ ${id}: invalid input — ${parsed.error.issues[0].message}`)
    return { podcast: null, episodes: [] }
  }
  const input: PodcastInput = parsed.data as PodcastInput

  let lookup
  try {
    lookup = await appleLookup(input.applePodcastId)
  } catch (e) {
    console.error(`✗ ${id}: Apple lookup failed — ${(e as Error).message}`)
    const stale = staleFallback(id, existingPodcasts, "Apple lookup failed")
    return stale
  }
  if (!lookup) {
    console.error(`✗ ${id}: Apple lookup returned no results`)
    return staleFallback(id, existingPodcasts, "Apple lookup empty")
  }

  const rssUrl = input.rssUrl ?? lookup.feedUrl
  if (!rssUrl) {
    console.error(`✗ ${id}: no RSS feed available`)
    return staleFallback(id, existingPodcasts, "no rssUrl")
  }

  let feed
  try {
    feed = await fetchAndParseRss(rssUrl)
  } catch (e) {
    console.error(`✗ ${id}: RSS fetch/parse failed — ${(e as Error).message}`)
    return staleFallback(id, existingPodcasts, "RSS fetch failed")
  }

  // Sort newest first
  const sorted = [...feed.episodes].sort((a, b) => {
    const da = safeDate(a.publishedAt)?.getTime() ?? 0
    const db = safeDate(b.publishedAt)?.getTime() ?? 0
    return db - da
  })

  const lastEpisodeDate = sorted.length
    ? safeDate(sorted[0].publishedAt)
    : null
  const firstEpisodeDate = sorted.length
    ? safeDate(sorted[sorted.length - 1].publishedAt)
    : null
  const hasVideo = sorted.some((e) => !!e.videoUrl)

  const episodes: Episode[] = sorted.map((e) => ({
    id: e.id,
    podcastId: id,
    title: e.title,
    description: e.description,
    publishedAt: safeDate(e.publishedAt)?.toISOString() ?? "",
    duration: e.duration,
    audioUrl: e.audioUrl,
    videoUrl: e.videoUrl,
    imageUrl: e.imageUrl,
    episodeNumber: e.episodeNumber,
    seasonNumber: e.seasonNumber,
    explicit: e.explicit,
    episodeType: e.episodeType,
    appleEpisodeId: null,
    link: e.link,
  }))

  // --- Apple ratings + recent reviews ----------------------------------
  // The iTunes Lookup endpoint does NOT return averageUserRating /
  // userRatingCount for podcasts (the fields are absent), so we rely on
  // a scrape of the public Apple Podcasts page (cached daily by
  // update-ratings.ts) and a separate customer-reviews RSS feed.
  // For brand-new podcasts that aren't yet in ratings.json / reviews.json,
  // we inline-scrape once so the first build still has data.
  let appleRating = ratings[id]?.apple ?? null
  let recentReviews: AppleReview[] = reviews[id] ?? []

  if (!appleRating) {
    try {
      const agg = await appleScrapeAggregateRating(input.applePodcastId)
      if (agg) {
        appleRating = {
          averageRating: agg.averageRating,
          ratingCount: agg.ratingCount,
          fetchedAt: agg.scrapedAt,
        }
      }
    } catch {
      /* swallow - leave appleRating null */
    }
  }

  if (recentReviews.length === 0) {
    try {
      recentReviews = await appleFetchRecentReviews(input.applePodcastId, 5)
    } catch {
      /* swallow - leave reviews empty */
    }
  }

  const podcast: Podcast = {
    id,
    applePodcastId: input.applePodcastId,
    title: feed.title || lookup.collectionName,
    description: feed.description,
    summary: feed.summary,
    subtitle: feed.subtitle,
    image: lookup.artworkUrl600 ?? "",
    author: feed.author || lookup.artistName,
    language: feed.language,
    categories: feed.categories.length ? feed.categories : lookup.genres,
    explicit: feed.explicit,
    websiteUrl: input.websiteUrl ?? feed.link,
    rssUrl,
    copyright: feed.copyright,
    spotifyUrl: normalizeSpotifyUrl(input.spotifyUrl),
    youtubeUrl: input.youtubeUrl ?? null,
    twitterUrl: input.twitterUrl ?? null,
    linkedinUrl: input.linkedinUrl ?? null,
    applePodcastUrl: applePodcastUrlFor(input.applePodcastId),
    tags: input.tags ?? [],
    cadence: input.cadence ?? null,
    format: input.format ?? null,
    authors: input.authors ?? [],
    lastEpisodeDate: lastEpisodeDate?.toISOString() ?? null,
    firstEpisodeDate: firstEpisodeDate?.toISOString() ?? null,
    episodeCount: episodes.length,
    hasVideo,
    isActive: isActiveBy(lastEpisodeDate),
    featured: input.featured ?? false,
    ratings: {
      apple: appleRating ?? {
        averageRating: null,
        ratingCount: null,
        fetchedAt: new Date().toISOString(),
      },
    },
    recentReviews: recentReviews.length > 0 ? recentReviews : undefined,
    submittedBy: input.submittedBy,
  }

  return { podcast, episodes }
}

async function main(): Promise<void> {
  console.log("Starting podcast build pipeline...")
  if (!fs.existsSync(PODCASTS_DIR)) {
    fs.mkdirSync(PODCASTS_DIR, { recursive: true })
  }
  if (!fs.existsSync(OUTPUT_EPISODES_DIR)) {
    fs.mkdirSync(OUTPUT_EPISODES_DIR, { recursive: true })
  }
  const files = fs
    .readdirSync(PODCASTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(PODCASTS_DIR, f))
    .sort()

  console.log(`Found ${files.length} input file(s).`)

  const ratings = loadExistingRatings()
  const reviews = loadExistingReviews()
  const existingPodcasts = loadExistingPodcasts()
  const podcasts: Podcast[] = []
  let episodeTotal = 0

  // Process serially-ish but allow some parallelism
  const concurrency = 4
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency)
    const results = await Promise.all(
      batch.map((f) => processOne(f, ratings, reviews, existingPodcasts))
    )
    for (const r of results) {
      if (r.podcast) {
        podcasts.push(r.podcast)
        const epPath = path.join(
          OUTPUT_EPISODES_DIR,
          `${r.podcast.id}.json`
        )
        fs.writeFileSync(epPath, JSON.stringify(r.episodes, null, 2))
        episodeTotal += r.episodes.length
        console.log(
          `✓ ${r.podcast.id} — ${r.podcast.title} (${r.episodes.length} eps, active=${r.podcast.isActive})`
        )
      }
    }
  }

  podcasts.sort((a, b) => a.id.localeCompare(b.id))
  fs.writeFileSync(OUTPUT_PODCASTS, JSON.stringify(podcasts, null, 2))

  // Slim search index for client-side use (placed in public/ for static export)
  const searchIndex = podcasts.map((p) => ({
    id: p.id,
    title: p.title,
    author: p.author,
    image: p.image,
    tags: p.tags,
    isActive: p.isActive,
  }))
  const publicDir = path.join(ROOT, "public")
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
  fs.writeFileSync(
    path.join(publicDir, "podcasts-index.json"),
    JSON.stringify(searchIndex)
  )

  // Mirror the raw input JSON files into public/ so the /submit edit form
  // can pre-fill from them at runtime (they're tiny — typically <500 bytes each).
  const publicInputsDir = path.join(publicDir, "podcasts-input")
  if (fs.existsSync(publicInputsDir)) {
    for (const f of fs.readdirSync(publicInputsDir)) {
      fs.unlinkSync(path.join(publicInputsDir, f))
    }
  } else {
    fs.mkdirSync(publicInputsDir, { recursive: true })
  }
  for (const file of files) {
    const id = path.basename(file, ".json")
    fs.copyFileSync(file, path.join(publicInputsDir, `${id}.json`))
  }

  console.log(
    `\n✓ Wrote ${podcasts.length} podcast(s), ${episodeTotal} episode(s) to @data/`
  )

  // Tear down the lazily-launched Playwright/Chromium browser, if any. If we
  // skip this the child process keeps the Node event loop alive and the
  // script hangs until CI cancels it after 25 minutes.
  await closeBrowser()
}

main()
  .then(() => {
    // Belt-and-braces: even if some other library (sharp's worker pool, libuv
    // handles, fetch keep-alive sockets) ends up holding the loop open, we
    // know our work is logically done at this point and can safely exit.
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

export { slugify }
