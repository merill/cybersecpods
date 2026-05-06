import fs from "node:fs"
import path from "node:path"
import {
  appleFetchRecentReviews,
  appleScrapeAggregateRating,
  type AppleReview,
} from "./lib/apple.js"
import { closeBrowser } from "./lib/rss.js"

const ROOT = process.cwd()
const PODCASTS_DIR = path.join(ROOT, "@data", "podcasts")
const RATINGS_FILE = path.join(ROOT, "@data", "ratings.json")
const REVIEWS_FILE = path.join(ROOT, "@data", "reviews.json")

interface RatingsRecord {
  [podcastId: string]: {
    apple?: {
      averageRating: number | null
      ratingCount: number | null
      fetchedAt: string
    }
  }
}

interface ReviewsRecord {
  [podcastId: string]: AppleReview[]
}

async function main(): Promise<void> {
  console.log("Refreshing Apple ratings and reviews...")
  const files = fs
    .readdirSync(PODCASTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(PODCASTS_DIR, f))
    .sort()

  const ratings: RatingsRecord = fs.existsSync(RATINGS_FILE)
    ? JSON.parse(fs.readFileSync(RATINGS_FILE, "utf8"))
    : {}
  const reviews: ReviewsRecord = fs.existsSync(REVIEWS_FILE)
    ? JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8"))
    : {}

  let ratingsHit = 0
  let ratingsMiss = 0
  let reviewsHit = 0
  let reviewsMiss = 0
  const missingRatings: string[] = []
  const missingReviews: string[] = []

  for (const file of files) {
    const id = path.basename(file, ".json")
    const json = JSON.parse(fs.readFileSync(file, "utf8")) as {
      applePodcastId?: string
    }
    if (!json.applePodcastId) continue

    // --- Aggregate rating (HTML scrape) -----------------------------------
    try {
      const agg = await appleScrapeAggregateRating(json.applePodcastId)
      if (agg) {
        ratings[id] = {
          apple: {
            averageRating: agg.averageRating,
            ratingCount: agg.ratingCount,
            fetchedAt: agg.scrapedAt,
          },
        }
        ratingsHit++
        console.log(
          `  ✓ ${id}: ${agg.averageRating.toFixed(1)}★ (${agg.ratingCount} ratings)`
        )
      } else {
        ratingsMiss++
        missingRatings.push(id)
        console.log(`  – ${id}: no aggregate rating found`)
      }
    } catch (e) {
      ratingsMiss++
      missingRatings.push(id)
      console.warn(`  ! ${id}: rating scrape failed — ${(e as Error).message}`)
    }

    // --- Recent reviews (RSS) ---------------------------------------------
    try {
      const recent = await appleFetchRecentReviews(json.applePodcastId, 5)
      if (recent.length > 0) {
        reviews[id] = recent
        reviewsHit++
      } else {
        reviewsMiss++
        missingReviews.push(id)
      }
    } catch (e) {
      reviewsMiss++
      missingReviews.push(id)
      console.warn(`  ! ${id}: reviews fetch failed — ${(e as Error).message}`)
    }
  }

  fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2))
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2))

  console.log(
    `\n✓ Ratings: ${ratingsHit}/${ratingsHit + ratingsMiss} (${ratingsMiss} missing)`
  )
  console.log(
    `✓ Reviews: ${reviewsHit}/${reviewsHit + reviewsMiss} (${reviewsMiss} missing)`
  )
  if (missingRatings.length && missingRatings.length <= 15) {
    console.log(`  Missing ratings: ${missingRatings.join(", ")}`)
  }
  if (missingReviews.length && missingReviews.length <= 15) {
    console.log(`  Missing reviews: ${missingReviews.join(", ")}`)
  }
}

main()
  .then(async () => {
    // No-op if no browser was launched; here purely for symmetry with
    // update-podcasts so future browser-using code paths in this script
    // don't reintroduce the hang.
    await closeBrowser()
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
