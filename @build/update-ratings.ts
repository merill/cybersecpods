import fs from "node:fs"
import path from "node:path"
import { appleLookup } from "./lib/apple.js"

const ROOT = process.cwd()
const PODCASTS_DIR = path.join(ROOT, "@data", "podcasts")
const RATINGS_FILE = path.join(ROOT, "@data", "ratings.json")

interface RatingsRecord {
  [podcastId: string]: {
    apple?: {
      averageRating: number | null
      ratingCount: number | null
      fetchedAt: string
    }
  }
}

async function main(): Promise<void> {
  console.log("Refreshing Apple ratings...")
  const files = fs
    .readdirSync(PODCASTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(PODCASTS_DIR, f))
    .sort()

  const out: RatingsRecord = fs.existsSync(RATINGS_FILE)
    ? JSON.parse(fs.readFileSync(RATINGS_FILE, "utf8"))
    : {}

  let updated = 0
  for (const file of files) {
    const id = path.basename(file, ".json")
    const json = JSON.parse(fs.readFileSync(file, "utf8")) as { applePodcastId?: string }
    if (!json.applePodcastId) continue

    try {
      const lookup = await appleLookup(json.applePodcastId)
      if (!lookup) {
        console.warn(`  ! ${id}: Apple lookup empty`)
        continue
      }
      out[id] = {
        apple: {
          averageRating: lookup.averageUserRating,
          ratingCount: lookup.userRatingCount,
          fetchedAt: new Date().toISOString(),
        },
      }
      updated++
      console.log(
        `  ✓ ${id}: ${lookup.averageUserRating ?? "—"}★ (${
          lookup.userRatingCount ?? 0
        } ratings)`
      )
    } catch (e) {
      console.warn(`  ! ${id}: ${(e as Error).message}`)
    }
  }

  fs.writeFileSync(RATINGS_FILE, JSON.stringify(out, null, 2))
  console.log(`\n✓ Updated ratings for ${updated} podcast(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
