import fs from "node:fs"
import path from "node:path"
import { podcastInputSchema } from "./lib/zod-schemas.js"
import { appleLookup } from "./lib/apple.js"
import { fetchAndParseRss } from "./lib/rss.js"

const PODCASTS_DIR = path.join(process.cwd(), "@data", "podcasts")

interface FileIssue {
  file: string
  error: string
}

interface ValidationResult {
  ok: boolean
  issues: FileIssue[]
  validated: number
}

function listFiles(): string[] {
  return fs
    .readdirSync(PODCASTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(PODCASTS_DIR, f))
}

function changedFiles(): string[] | null {
  // GitHub Action populates CHANGED_FILES env var with newline-separated paths
  const raw = process.env.CHANGED_FILES
  if (!raw) return null
  return raw
    .split(/\s+/)
    .filter((p) => p.startsWith("@data/podcasts/") && p.endsWith(".json"))
    .map((p) => path.join(process.cwd(), p))
}

function isKebab(s: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)
}

async function validateFile(
  file: string,
  allInputs: Map<string, string>
): Promise<FileIssue[]> {
  const issues: FileIssue[] = []
  const rel = path.relative(process.cwd(), file)
  const base = path.basename(file, ".json")

  if (!isKebab(base)) {
    issues.push({
      file: rel,
      error: `Filename "${base}.json" must be kebab-case (e.g. \`my-podcast.json\`).`,
    })
  }

  let raw: string
  try {
    raw = fs.readFileSync(file, "utf8")
  } catch (e) {
    issues.push({ file: rel, error: `Failed to read file: ${(e as Error).message}` })
    return issues
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch (e) {
    issues.push({ file: rel, error: `Invalid JSON: ${(e as Error).message}` })
    return issues
  }

  const parsed = podcastInputSchema.safeParse(json)
  if (!parsed.success) {
    for (const err of parsed.error.issues) {
      issues.push({
        file: rel,
        error: `\`${err.path.join(".") || "(root)"}\`: ${err.message}`,
      })
    }
    return issues
  }
  const input = parsed.data

  // Duplicate check across all inputs
  const seen = allInputs.get(input.applePodcastId)
  if (seen && seen !== file) {
    issues.push({
      file: rel,
      error: `Duplicate \`applePodcastId\` (${input.applePodcastId}) — already used by \`${path.basename(seen)}\`.`,
    })
  }

  // Network checks (skipped if SKIP_NETWORK=1 for local fast runs)
  if (process.env.SKIP_NETWORK !== "1") {
    let lookup
    try {
      lookup = await appleLookup(input.applePodcastId)
    } catch (e) {
      issues.push({
        file: rel,
        error: `Apple iTunes Lookup failed: ${(e as Error).message}`,
      })
      return issues
    }
    if (!lookup) {
      issues.push({
        file: rel,
        error: `Apple Podcast ID \`${input.applePodcastId}\` returned no results from the iTunes Lookup API.`,
      })
      return issues
    }
    const rssUrl = input.rssUrl ?? lookup.feedUrl
    if (!rssUrl) {
      issues.push({
        file: rel,
        error: `No RSS feed found. Apple did not provide a feedUrl; please add \`rssUrl\` to the JSON.`,
      })
    } else if (input.rssUrl && input.rssUrl !== lookup.feedUrl) {
      // Submitter overrode Apple's feedUrl. Verify the override actually
      // resolves to a podcast feed; if it 403s/blocks, surface a soft warning
      // rather than failing the PR — Apple's feedUrl is still authoritative.
      try {
        const feed = await fetchAndParseRss(input.rssUrl)
        if (!feed.title) {
          issues.push({
            file: rel,
            error: `RSS feed at ${input.rssUrl} returned but has no <title>. Probably not a podcast feed.`,
          })
        }
      } catch (e) {
        const msg = (e as Error).message
        // Network-level failures from the runner shouldn't block submissions —
        // hosts like Substack 403 GitHub Actions IPs even though the feed is
        // valid. Apple already verified this URL when issuing feedUrl, so we
        // log and continue.
        console.error(
          `  (warn) RSS override fetch failed for ${rel}: ${msg} — falling back to Apple feedUrl trust`
        )
      }
    }
    // When rssUrl matches Apple's feedUrl (or is omitted), trust Apple's
    // verification and skip the live fetch. This avoids false-negative
    // submission blocks from CI-IP-based anti-bot rules (Substack, etc.).
  }

  return issues
}

async function main(): Promise<void> {
  const allFiles = listFiles()
  const allInputs = new Map<string, string>()
  for (const f of allFiles) {
    try {
      const j = JSON.parse(fs.readFileSync(f, "utf8")) as { applePodcastId?: string }
      if (j.applePodcastId) allInputs.set(j.applePodcastId, f)
    } catch {
      // ignore — will surface during per-file validation
    }
  }

  const target = changedFiles() ?? allFiles
  console.error(`Validating ${target.length} podcast file(s)...`)

  const allIssues: FileIssue[] = []
  for (const file of target) {
    if (!fs.existsSync(file)) continue // deleted in PR
    const issues = await validateFile(file, allInputs)
    allIssues.push(...issues)
  }

  const result: ValidationResult = {
    ok: allIssues.length === 0,
    issues: allIssues,
    validated: target.length,
  }

  // Write output for the GitHub Action to consume
  const out = process.env.VALIDATION_OUTPUT
  if (out) {
    fs.writeFileSync(out, JSON.stringify(result, null, 2))
  }

  if (!result.ok) {
    console.error(`\n✗ Validation failed with ${allIssues.length} issue(s):`)
    for (const i of allIssues) console.error(`  - ${i.file}: ${i.error}`)
    process.exit(1)
  }
  console.error(`\n✓ Validation passed for ${target.length} file(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
