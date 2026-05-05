// One-time helper: given a curated list of cybersecurity podcasts, generate
// @data/podcasts/<slug>.json files. Looks up each entry on Apple to get the
// canonical applePodcastId.
//
// Usage:
//   npm run import:bulk
//
// Existing files are NOT overwritten so this script is idempotent.

import fs from "node:fs"
import path from "node:path"
import { appleSearch, appleLookup } from "./lib/apple.js"
import { slugify } from "./lib/rss.js"

const PODCASTS_DIR = path.join(process.cwd(), "@data", "podcasts")

interface SeedEntry {
  /** Slug to use for the file (kebab-case). */
  slug: string
  /** Apple Podcast ID if known (preferred — skips search). */
  applePodcastId?: string
  /** Search term used if applePodcastId not provided. */
  searchTerm?: string
  /** Optional artist filter to disambiguate search results. */
  artistContains?: string
  /** Optional curated tags. */
  tags?: string[]
  /** Optional YouTube URL. */
  youtubeUrl?: string
  /** Optional Spotify URL. */
  spotifyUrl?: string
  /** Optional website override. */
  websiteUrl?: string
  /** Optional Twitter/X URL. */
  twitterUrl?: string
  /** Optional LinkedIn URL. */
  linkedinUrl?: string
}

const SEEDS: SeedEntry[] = [
  // Already in repo: darknet-diaries, entra-chat — but listed here for completeness/recovery
  {
    slug: "darknet-diaries",
    applePodcastId: "1296350485",
    tags: ["true-crime", "hacking", "storytelling"],
    youtubeUrl: "https://www.youtube.com/jackrhysider",
  },
  {
    slug: "entra-chat",
    applePodcastId: "1801200012",
    tags: ["microsoft-entra", "identity"],
    youtubeUrl:
      "https://www.youtube.com/watch?v=cJRYm5KReBM&list=PL06Jj3_onEzEBGRfA7Zddg1IrjgpU1eGp",
  },

  // Tier-1 known IDs (verified, no search needed)
  { slug: "risky-business", applePodcastId: "216478078", tags: ["news", "weekly", "industry"] },
  { slug: "smashing-security", applePodcastId: "1195001633", tags: ["news", "weekly", "humor"] },
  { slug: "security-now", applePodcastId: "79016499", tags: ["technical", "weekly", "industry"] },
  { slug: "cyberwire-daily", applePodcastId: "1071831261", tags: ["news", "daily"] },
  { slug: "hacking-humans", applePodcastId: "1391915810", tags: ["social-engineering", "weekly"] },
  { slug: "malicious-life", applePodcastId: "1252417787", tags: ["history", "storytelling"] },
  { slug: "click-here", applePodcastId: "1225077306", tags: ["news", "investigative"] },
  { slug: "hacked", applePodcastId: "1049420219", tags: ["storytelling", "news"] },
  { slug: "lock-and-code", applePodcastId: "1500049667", tags: ["consumer", "privacy"] },
  { slug: "hacker-valley-studio", applePodcastId: "1471881997", tags: ["interview", "career"] },
  { slug: "naked-security", applePodcastId: "171426676", tags: ["news", "weekly"] },
  { slug: "defensive-security", applePodcastId: "585914973", tags: ["blue-team", "weekly"] },
  { slug: "7-minute-security", applePodcastId: "797742806", tags: ["short-form", "pentest"] },
  { slug: "down-the-security-rabbithole", applePodcastId: "466659176", tags: ["interview"] },
  { slug: "ciso-series-podcast", applePodcastId: "1391337832", tags: ["leadership", "ciso"] },
  { slug: "defense-in-depth", applePodcastId: "1450197741", tags: ["leadership", "ciso"] },
  { slug: "cyber-security-headlines", applePodcastId: "1527478719", tags: ["news", "daily"] },
  { slug: "identity-at-the-center", applePodcastId: "1471899975", tags: ["identity", "iam"] },
  { slug: "cloud-security-podcast", applePodcastId: "1489678590", tags: ["cloud", "interview"] },
  { slug: "azure-security-podcast", applePodcastId: "1512476835", tags: ["azure", "cloud"] },
  { slug: "microsoft-threat-intelligence", applePodcastId: "1710656242", tags: ["threat-intel", "microsoft"] },
  { slug: "bluehat-podcast", applePodcastId: "1688087915", tags: ["microsoft", "research"] },
  { slug: "security-unlocked", applePodcastId: "1533925942", tags: ["microsoft", "research"] },
  { slug: "the-443", applePodcastId: "1399962220", tags: ["news", "weekly"] },
  { slug: "paul-s-security-weekly", applePodcastId: "1149992167", tags: ["news", "weekly"] },
  { slug: "application-security-weekly", applePodcastId: "1338907745", tags: ["appsec", "weekly"] },
  { slug: "enterprise-security-weekly", applePodcastId: "1112175960", tags: ["enterprise", "weekly"] },
  { slug: "business-security-weekly", applePodcastId: "1139240260", tags: ["leadership", "weekly"] },
  { slug: "beers-with-talos", applePodcastId: "1236329410", tags: ["threat-intel", "cisco"] },
  { slug: "talos-takes", applePodcastId: "1497572268", tags: ["threat-intel", "cisco", "short-form"] },
  { slug: "cyber-crime-junkies", applePodcastId: "1633932941", tags: ["true-crime", "interview"] },
  { slug: "shadowtalk", applePodcastId: "1326304686", tags: ["threat-intel"] },
  { slug: "the-social-engineer-podcast", applePodcastId: "334648685", tags: ["social-engineering"] },
  { slug: "ciso-tradecraft", applePodcastId: "1538132658", tags: ["leadership", "ciso"] },
  { slug: "reimagining-cyber", applePodcastId: "1542819224", tags: ["leadership", "interview"] },
  { slug: "cybercrime-magazine", applePodcastId: "1428735886", tags: ["news", "interview"] },
  { slug: "absolute-appsec", applePodcastId: "1402701626", tags: ["appsec"] },
  { slug: "open-source-security", applePodcastId: "1151833659", tags: ["open-source", "appsec"] },
  { slug: "purple-squad-security", applePodcastId: "1269095333", tags: ["purple-team"] },
  { slug: "to-the-point-cybersecurity", applePodcastId: "1438873656", tags: ["interview"] },
  { slug: "cyber-work", applePodcastId: "1419689068", tags: ["career", "interview"] },
  { slug: "cyber-empathy", applePodcastId: "1591867425", tags: ["culture", "leadership"] },
  { slug: "afternoon-cyber-tea", applePodcastId: "1484676119", tags: ["leadership", "interview"] },

  // Verified additional IDs to round out coverage
  { slug: "unsupervised-learning", applePodcastId: "1099711235", tags: ["news", "ai", "weekly"] },
  { slug: "8th-layer-insights", applePodcastId: "1555610335", tags: ["awareness", "human-factors"] },
  { slug: "cybersecurity-defenders", applePodcastId: "1649981740", tags: ["soc", "blue-team"] },
  { slug: "shared-security-podcast", applePodcastId: "329032812", tags: ["weekly", "privacy"] },
  { slug: "risky-bulletin", applePodcastId: "1621305970", tags: ["news", "weekly"] },
  { slug: "threat-vector", applePodcastId: "1725324656", tags: ["threat-intel", "palo-alto"] },
  { slug: "nexus-claroty", applePodcastId: "1540650068", tags: ["ot-security", "interview"] },
]

function fileFor(slug: string): string {
  return path.join(PODCASTS_DIR, `${slug}.json`)
}

interface OutInput {
  applePodcastId: string
  spotifyUrl?: string
  websiteUrl?: string
  rssUrl?: string
  youtubeUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  tags?: string[]
}

async function resolveAppleId(seed: SeedEntry): Promise<string | null> {
  if (seed.applePodcastId) return seed.applePodcastId.replace(/^id/, "")
  if (!seed.searchTerm) return null
  try {
    const results = await appleSearch(seed.searchTerm, "us", 25)
    let cands = results
    if (seed.artistContains) {
      const needle = seed.artistContains.toLowerCase()
      cands = results.filter(
        (r) =>
          (r.artistName || "").toLowerCase().includes(needle) ||
          (r.collectionName || "").toLowerCase().includes(needle)
      )
    }
    // Prefer exact name match
    const term = seed.searchTerm.toLowerCase()
    const exact = cands.find(
      (r) => (r.collectionName || "").toLowerCase() === term
    )
    const pick = exact ?? cands[0] ?? results[0]
    return pick ? String(pick.collectionId) : null
  } catch (e) {
    console.warn(`  ! search failed for ${seed.slug}: ${(e as Error).message}`)
    return null
  }
}

async function main(): Promise<void> {
  if (!fs.existsSync(PODCASTS_DIR)) fs.mkdirSync(PODCASTS_DIR, { recursive: true })
  console.log(`Importing ${SEEDS.length} podcast seed(s)...`)

  let created = 0
  let skipped = 0
  let failed = 0

  for (const seed of SEEDS) {
    const slug = slugify(seed.slug)
    const out = fileFor(slug)
    if (fs.existsSync(out)) {
      skipped++
      continue
    }

    const appleId = await resolveAppleId(seed)
    if (!appleId) {
      console.warn(`  ✗ ${slug}: could not resolve Apple ID`)
      failed++
      continue
    }

    // Verify we can actually look it up + fetch the feed
    const lookup = await appleLookup(appleId)
    if (!lookup) {
      console.warn(`  ✗ ${slug}: Apple lookup returned no results`)
      failed++
      continue
    }

    const data: OutInput = {
      applePodcastId: appleId,
    }
    if (seed.youtubeUrl) data.youtubeUrl = seed.youtubeUrl
    if (seed.spotifyUrl) data.spotifyUrl = seed.spotifyUrl
    if (seed.websiteUrl) data.websiteUrl = seed.websiteUrl
    if (seed.twitterUrl) data.twitterUrl = seed.twitterUrl
    if (seed.linkedinUrl) data.linkedinUrl = seed.linkedinUrl
    if (seed.tags && seed.tags.length) data.tags = seed.tags

    fs.writeFileSync(out, JSON.stringify(data, null, 2) + "\n")
    created++
    console.log(`  ✓ ${slug} → ${lookup.collectionName} (${appleId})`)
  }

  console.log(
    `\nDone. created=${created} skipped(existing)=${skipped} failed=${failed}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
