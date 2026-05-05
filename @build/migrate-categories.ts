#!/usr/bin/env tsx
/**
 * One-shot migration: re-tag every @data/podcasts/*.json input file with the
 * canonical 26-category taxonomy + cadence + format.
 *
 * This is intentionally a separate script (not part of the standard build)
 * so the mapping is auditable. It rewrites tags based on the explicit
 * mapping below. Old tags are silently dropped if not present in the map.
 */
import fs from "node:fs"
import path from "node:path"
import {
  CATEGORY_SLUGS,
  CADENCE_VALUES,
  FORMAT_VALUES,
  type Cadence,
  type CategorySlug,
  type Format,
} from "../lib/categories"

interface Mapping {
  tags: CategorySlug[]
  cadence?: Cadence
  format?: Format
}

// Best-judgment mapping per podcast, derived from titles, descriptions,
// existing tags, and known programming. Each entry maps a podcast slug
// (filename without .json) to its canonical taxonomy.
const MAP: Record<string, Mapping> = {
  "7-minute-security": {
    tags: ["penetration-testing", "blue-team"],
    cadence: "weekly",
    format: "solo",
  },
  "8th-layer-insights": {
    tags: ["awareness-training", "leadership"],
    cadence: "irregular",
    format: "interview",
  },
  "absolute-appsec": {
    tags: ["appsec", "devsecops"],
    cadence: "weekly",
    format: "interview",
  },
  "afternoon-cyber-tea": {
    tags: ["leadership", "interviews"],
    cadence: "biweekly",
    format: "interview",
  },
  "application-security-weekly": {
    tags: ["appsec", "devsecops"],
    cadence: "weekly",
    format: "panel",
  },
  "azure-security-podcast": {
    tags: ["cloud-security", "identity"],
    cadence: "weekly",
    format: "panel",
  },
  "beers-with-talos": {
    tags: ["threat-intel", "incident-response"],
    cadence: "irregular",
    format: "panel",
  },
  "bluehat-podcast": {
    tags: ["research", "vulnerability-management"],
    cadence: "monthly",
    format: "interview",
  },
  "business-security-weekly": {
    tags: ["leadership", "governance-risk-compliance"],
    cadence: "weekly",
    format: "panel",
  },
  "ciso-series-podcast": {
    tags: ["leadership", "governance-risk-compliance"],
    cadence: "weekly",
    format: "panel",
  },
  "ciso-tradecraft": {
    tags: ["leadership", "career"],
    cadence: "weekly",
    format: "interview",
  },
  "click-here": {
    tags: ["news", "storytelling", "threat-intel"],
    cadence: "weekly",
    format: "narrative",
  },
  "cloud-security-podcast": {
    tags: ["cloud-security", "interviews"],
    cadence: "weekly",
    format: "interview",
  },
  "cyber-crime-junkies": {
    tags: ["storytelling", "incident-response"],
    cadence: "weekly",
    format: "interview",
  },
  "cyber-empathy": {
    tags: ["leadership", "career", "awareness-training"],
    cadence: "irregular",
    format: "interview",
  },
  "cyber-security-headlines": {
    tags: ["news"],
    cadence: "daily",
    format: "news-brief",
  },
  "cyber-work": {
    tags: ["career", "awareness-training"],
    cadence: "weekly",
    format: "interview",
  },
  "cybercrime-magazine": {
    tags: ["news", "interviews"],
    cadence: "daily",
    format: "interview",
  },
  "cybersecurity-defenders": {
    tags: ["soc", "blue-team", "threat-intel"],
    cadence: "weekly",
    format: "interview",
  },
  "cyberwire-daily": {
    tags: ["news", "threat-intel"],
    cadence: "daily",
    format: "news-brief",
  },
  "darknet-diaries": {
    tags: ["storytelling", "incident-response", "threat-intel"],
    cadence: "biweekly",
    format: "narrative",
  },
  "decoding-security": {
    tags: ["leadership", "governance-risk-compliance"],
    cadence: "monthly",
    format: "interview",
  },
  "defense-in-depth": {
    tags: ["leadership", "governance-risk-compliance"],
    cadence: "weekly",
    format: "panel",
  },
  "defensive-security": {
    tags: ["blue-team", "incident-response", "news"],
    cadence: "weekly",
    format: "panel",
  },
  "down-the-security-rabbithole": {
    tags: ["leadership", "interviews"],
    cadence: "weekly",
    format: "interview",
  },
  "enterprise-security-weekly": {
    tags: ["leadership", "network-security", "news"],
    cadence: "weekly",
    format: "panel",
  },
  "entra-chat": {
    tags: ["identity", "cloud-security"],
    cadence: "biweekly",
    format: "interview",
  },
  hacked: {
    tags: ["storytelling", "news"],
    cadence: "biweekly",
    format: "narrative",
  },
  "hacker-valley-studio": {
    tags: ["career", "interviews", "leadership"],
    cadence: "weekly",
    format: "interview",
  },
  "hacking-humans": {
    tags: ["awareness-training", "threat-intel"],
    cadence: "weekly",
    format: "panel",
  },
  "identity-at-the-center": {
    tags: ["identity"],
    cadence: "weekly",
    format: "interview",
  },
  "lock-and-code": {
    tags: ["privacy", "awareness-training"],
    cadence: "biweekly",
    format: "interview",
  },
  "malicious-life": {
    tags: ["storytelling", "research"],
    cadence: "biweekly",
    format: "narrative",
  },
  "microsoft-healthcare-security-brief": {
    tags: ["threat-intel", "governance-risk-compliance"],
    cadence: "monthly",
    format: "interview",
  },
  "microsoft-threat-intelligence": {
    tags: ["threat-intel", "incident-response"],
    cadence: "biweekly",
    format: "interview",
  },
  "naked-security": {
    tags: ["news", "awareness-training"],
    cadence: "weekly",
    format: "panel",
  },
  "nexus-claroty": {
    tags: ["ot-ics-security"],
    cadence: "biweekly",
    format: "interview",
  },
  "open-source-security": {
    tags: ["appsec", "devsecops"],
    cadence: "weekly",
    format: "interview",
  },
  "paul-s-security-weekly": {
    tags: ["news", "vulnerability-management"],
    cadence: "weekly",
    format: "panel",
  },
  "purple-squad-security": {
    tags: ["purple-team", "red-team", "blue-team"],
    cadence: "irregular",
    format: "interview",
  },
  "reimagining-cyber": {
    tags: ["leadership", "governance-risk-compliance"],
    cadence: "weekly",
    format: "interview",
  },
  "risky-bulletin": {
    tags: ["news", "threat-intel"],
    cadence: "weekly",
    format: "news-brief",
  },
  "risky-business": {
    tags: ["news", "threat-intel"],
    cadence: "weekly",
    format: "panel",
  },
  "secure-the-job": {
    tags: ["career", "awareness-training"],
    cadence: "biweekly",
    format: "interview",
  },
  "security-insider-conversations": {
    tags: ["leadership", "interviews"],
    cadence: "monthly",
    format: "interview",
  },
  "security-life-hacks": {
    tags: ["awareness-training", "career"],
    cadence: "irregular",
    format: "interview",
  },
  "security-now": {
    tags: ["news", "vulnerability-management", "privacy"],
    cadence: "weekly",
    format: "panel",
  },
  "security-unlocked-ciso-series": {
    tags: ["leadership", "governance-risk-compliance"],
    cadence: "monthly",
    format: "interview",
  },
  "security-unlocked": {
    tags: ["research", "ai-security", "threat-intel"],
    cadence: "irregular",
    format: "interview",
  },
  shadowtalk: {
    tags: ["threat-intel"],
    cadence: "weekly",
    format: "panel",
  },
  "shared-security-podcast": {
    tags: ["privacy", "awareness-training", "news"],
    cadence: "weekly",
    format: "panel",
  },
  "smashing-security": {
    tags: ["news", "privacy"],
    cadence: "weekly",
    format: "panel",
  },
  "talos-takes": {
    tags: ["threat-intel"],
    cadence: "weekly",
    format: "news-brief",
  },
  "the-443": {
    tags: ["news", "vulnerability-management"],
    cadence: "weekly",
    format: "panel",
  },
  "the-social-engineer-podcast": {
    tags: ["awareness-training", "research"],
    cadence: "monthly",
    format: "interview",
  },
  "threat-vector": {
    tags: ["threat-intel", "incident-response"],
    cadence: "weekly",
    format: "interview",
  },
  "to-the-point-cybersecurity": {
    tags: ["leadership", "governance-risk-compliance"],
    cadence: "weekly",
    format: "interview",
  },
  "unsupervised-learning": {
    tags: ["news", "ai-security", "emerging-tech"],
    cadence: "weekly",
    format: "solo",
  },
}

// ---------- Self-validation ----------
function validate(): void {
  const known = new Set<string>(CATEGORY_SLUGS)
  const cad = new Set<string>(CADENCE_VALUES)
  const fmt = new Set<string>(FORMAT_VALUES)
  for (const [id, m] of Object.entries(MAP)) {
    if (m.tags.length < 1 || m.tags.length > 5) {
      throw new Error(`${id}: tags must be 1-5 (got ${m.tags.length})`)
    }
    if (new Set(m.tags).size !== m.tags.length) {
      throw new Error(`${id}: duplicate tag in ${JSON.stringify(m.tags)}`)
    }
    for (const t of m.tags) {
      if (!known.has(t)) throw new Error(`${id}: unknown category "${t}"`)
    }
    if (m.cadence && !cad.has(m.cadence)) {
      throw new Error(`${id}: invalid cadence "${m.cadence}"`)
    }
    if (m.format && !fmt.has(m.format)) {
      throw new Error(`${id}: invalid format "${m.format}"`)
    }
  }
}

// ---------- Apply ----------
function main(): void {
  validate()
  const PODCASTS_DIR = path.join(process.cwd(), "@data", "podcasts")
  const files = fs
    .readdirSync(PODCASTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()

  let updated = 0
  let unmapped: string[] = []
  for (const f of files) {
    const id = path.basename(f, ".json")
    const file = path.join(PODCASTS_DIR, f)
    const json = JSON.parse(fs.readFileSync(file, "utf8"))
    const mapping = MAP[id]
    if (!mapping) {
      unmapped.push(id)
      continue
    }
    json.tags = mapping.tags
    if (mapping.cadence) json.cadence = mapping.cadence
    else delete json.cadence
    if (mapping.format) json.format = mapping.format
    else delete json.format

    fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n")
    updated++
  }

  console.log(`✓ Re-tagged ${updated} podcast input file(s).`)
  if (unmapped.length) {
    console.warn(
      `⚠ ${unmapped.length} file(s) without mapping (left untouched):`
    )
    for (const id of unmapped) console.warn(`  - ${id}`)
  }
}

main()
