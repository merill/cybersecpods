import { XMLParser } from "fast-xml-parser"
import { withCache } from "./cache.js"
import slugifyLib from "slugify"

const slugify = (s: string): string =>
  (slugifyLib as unknown as (s: string, opts?: object) => string)(s, {
    lower: true,
    strict: true,
    trim: true,
  })

const UA =
  "Mozilla/5.0 (compatible; CyberSecPodsBot/1.0; +https://cybersecpods.com)"

export interface ParsedEpisode {
  id: string
  title: string
  description: string
  publishedAt: string
  duration: number
  audioUrl: string | null
  videoUrl: string | null
  imageUrl: string | null
  episodeNumber: number | null
  seasonNumber: number | null
  explicit: boolean
  episodeType: string | null
  guid: string
  link: string | null
}

export interface ParsedFeed {
  title: string
  description: string
  summary: string
  subtitle: string
  link: string
  author: string
  language: string
  image: string
  categories: string[]
  explicit: boolean
  copyright: string
  episodes: ParsedEpisode[]
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  cdataPropName: "__cdata",
  removeNSPrefix: false,
  parseAttributeValue: false,
  textNodeName: "#text",
  isArray: (name) =>
    [
      "item",
      "itunes:category",
      "category",
      "enclosure",
      "media:content",
    ].includes(name),
})

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function pickText(node: unknown): string {
  if (node == null) return ""
  if (typeof node === "string") return decodeEntities(node.trim())
  if (typeof node === "number" || typeof node === "boolean") return String(node)
  if (Array.isArray(node)) return node.map(pickText).filter(Boolean).join(" ")
  if (typeof node === "object") {
    const o = node as Record<string, unknown>
    if (o.__cdata) return pickText(o.__cdata)
    if (o["#text"]) return pickText(o["#text"])
  }
  return ""
}

function pickAttr(node: unknown, attr: string): string {
  if (node && typeof node === "object" && !Array.isArray(node)) {
    const v = (node as Record<string, unknown>)[`@_${attr}`]
    if (typeof v === "string") return v
  }
  return ""
}

function parseDuration(raw: unknown): number {
  const s = pickText(raw)
  if (!s) return 0
  // either "HH:MM:SS", "MM:SS", or seconds
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  const parts = s.split(":").map((p) => parseInt(p, 10) || 0)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

function flattenCategories(node: unknown): string[] {
  if (!node) return []
  const cats: string[] = []
  const visit = (n: unknown) => {
    if (Array.isArray(n)) {
      n.forEach(visit)
      return
    }
    if (n && typeof n === "object") {
      const o = n as Record<string, unknown>
      const txt = (o["@_text"] as string) ?? pickText(o)
      if (txt) cats.push(txt)
      const sub = o["itunes:category"]
      if (sub) visit(sub)
    } else if (typeof n === "string") {
      cats.push(n)
    }
  }
  visit(node)
  return Array.from(new Set(cats)).filter(Boolean)
}

async function fetchText(url: string, timeoutMs = 30000): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml,application/xml,text/xml,*/*" },
      signal: ctrl.signal,
      redirect: "follow",
    })
    if (!res.ok) {
      // Cloudflare bot-management on Substack and similar hosts blocks bare
      // fetch from CI runners with 403. Fall back to a real Chromium via
      // playwright-core (lazy import). Only attempted for known-blocked hosts
      // so the cost (browser launch) is paid where it matters.
      if (res.status === 403 && shouldUseBrowserFor(url)) {
        try {
          return await fetchTextViaBrowser(url, timeoutMs)
        } catch (e) {
          throw new Error(
            `HTTP 403 for ${url}; browser fallback also failed: ${(e as Error).message}`
          )
        }
      }
      throw new Error(`HTTP ${res.status} for ${url}`)
    }
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

// ---------------------------------------------------------------------------
// Browser-based fetch fallback (Cloudflare bot-management bypass)
// ---------------------------------------------------------------------------

/**
 * Hosts whose Cloudflare bot-management TLS fingerprint check rejects bare
 * `fetch` from GitHub Actions IP ranges. For these we fall back to a real
 * Chromium instance which generates a valid JA3 fingerprint.
 *
 * Add hosts here as they're discovered; keep the list narrow because the
 * browser path is ~30x slower than direct fetch.
 */
const BROWSER_FALLBACK_HOSTS = new Set([
  "api.substack.com",
])
const BROWSER_FALLBACK_HOST_SUFFIXES = [
  ".substack.com",
]

function shouldUseBrowserFor(url: string): boolean {
  if (process.env.NO_BROWSER_FETCH === "1") return false
  try {
    const u = new URL(url)
    if (BROWSER_FALLBACK_HOSTS.has(u.hostname)) return true
    return BROWSER_FALLBACK_HOST_SUFFIXES.some((s) => u.hostname.endsWith(s))
  } catch {
    return false
  }
}

// Lazy-imported, lazily-launched browser shared across all calls in a single
// process. Long-running scripts (e.g. update-podcasts) MUST call closeBrowser()
// after they're done, otherwise the Chromium subprocess keeps Node's event
// loop alive and the script hangs forever (manifested as 25-minute CI
// timeouts; see fix in commit history).
let browserPromise: Promise<unknown> | null = null

interface PlaywrightLike {
  chromium: {
    launch: (opts?: { headless?: boolean }) => Promise<{
      newContext: (opts?: {
        userAgent?: string
        viewport?: { width: number; height: number } | null
      }) => Promise<{
        newPage: () => Promise<{
          goto: (
            url: string,
            opts?: { waitUntil?: "domcontentloaded" | "load"; timeout?: number }
          ) => Promise<{
            status: () => number
            body: () => Promise<Buffer>
          } | null>
          close: () => Promise<void>
        }>
        close: () => Promise<void>
      }>
      close: () => Promise<void>
    }>
  }
}

async function getBrowser(): Promise<unknown> {
  if (browserPromise) return browserPromise
  browserPromise = (async () => {
    let mod: PlaywrightLike
    try {
      // dynamic import so missing optional dep yields a clearer error message
      mod = (await import("playwright-core")) as unknown as PlaywrightLike
    } catch (e) {
      throw new Error(
        `playwright-core is not installed (run: npm install). Original: ${(e as Error).message}`
      )
    }
    return mod.chromium.launch({ headless: true })
  })()
  return browserPromise
}

/**
 * Tear down the lazily-launched Chromium browser, if any was started.
 *
 * Safe to call unconditionally — it's a no-op if no browser was ever needed.
 * Long-running entry-points (update-podcasts, update-ratings, OG generator)
 * must call this in their cleanup path; otherwise the playwright child
 * process keeps the Node event loop alive and the script never exits.
 */
export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return
  const p = browserPromise
  browserPromise = null
  try {
    const browser = (await p) as { close: () => Promise<void> }
    await browser.close()
  } catch {
    // Best-effort: if the browser already crashed or isn't fully launched
    // we still want the script to exit cleanly.
  }
}

async function fetchTextViaBrowser(
  url: string,
  timeoutMs = 30000
): Promise<string> {
  const browser = (await getBrowser()) as Awaited<
    ReturnType<PlaywrightLike["chromium"]["launch"]>
  >
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  })
  const page = await ctx.newPage()
  try {
    // Use the response object directly so we get raw bytes, bypassing
    // Chromium's XML viewer that would otherwise wrap the body in HTML.
    const resp = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    })
    if (!resp) {
      throw new Error(`browser navigation returned no response for ${url}`)
    }
    const status = resp.status()
    if (status >= 400) {
      throw new Error(
        `browser fetch HTTP ${status} for ${url} (Cloudflare may still be blocking)`
      )
    }
    const buf = await resp.body()
    return buf.toString("utf8")
  } finally {
    await ctx.close().catch(() => {})
  }
}

export async function fetchRss(url: string): Promise<string> {
  return withCache(
    "rss",
    url,
    () => fetchText(url),
    { ttlMs: 30 * 60 * 1000 } // 30 min
  )
}

export function parseRss(xml: string): ParsedFeed {
  const doc = xmlParser.parse(xml)
  const channel = doc?.rss?.channel ?? doc?.channel ?? {}

  const itunesImage = pickAttr(channel["itunes:image"], "href")
  const fallbackImage = pickText(
    (channel.image && (channel.image as Record<string, unknown>).url) ?? ""
  )

  const explicitRaw = pickText(channel["itunes:explicit"]).toLowerCase()
  const isExplicit = ["yes", "true", "explicit"].includes(explicitRaw)

  const items = Array.isArray(channel.item) ? channel.item : []

  const episodes: ParsedEpisode[] = items.map((item: Record<string, unknown>) => {
    const guid = pickText(item.guid) || pickText(item.link) || pickText(item.title)
    const title = pickText(item.title)
    const description =
      pickText(item["content:encoded"]) ||
      pickText(item.description) ||
      pickText(item["itunes:summary"])
    const publishedAt = pickText(item.pubDate)
    const duration = parseDuration(item["itunes:duration"])

    // Find audio + video enclosures (RSS supports multiple)
    const enclosures = Array.isArray(item.enclosure)
      ? item.enclosure
      : item.enclosure
      ? [item.enclosure]
      : []
    let audioUrl: string | null = null
    let videoUrl: string | null = null
    for (const enc of enclosures) {
      const type = pickAttr(enc, "type").toLowerCase()
      const u = pickAttr(enc, "url")
      if (!u) continue
      if (type.startsWith("audio/") && !audioUrl) audioUrl = u
      else if (type.startsWith("video/") && !videoUrl) videoUrl = u
      else if (!audioUrl && !type) audioUrl = u
    }

    // Apple's <itunes:video> tag (introduced for video podcasts)
    const itVideo = item["itunes:video"]
    if (itVideo && !videoUrl) {
      const v = pickAttr(itVideo, "src") || pickAttr(itVideo, "href")
      if (v) videoUrl = v
    }

    // media:content fallback
    const mc = item["media:content"]
    if (mc && !videoUrl) {
      const arr = Array.isArray(mc) ? mc : [mc]
      for (const m of arr) {
        const mt = pickAttr(m, "type").toLowerCase()
        const mu = pickAttr(m, "url")
        if (mu && (mt.startsWith("video/") || pickAttr(m, "medium") === "video")) {
          videoUrl = mu
          break
        }
      }
    }

    const itEpisodeImage = pickAttr(item["itunes:image"], "href")

    const episodeType = pickText(item["itunes:episodeType"]) || null
    const episodeNumberRaw = pickText(item["itunes:episode"])
    const seasonRaw = pickText(item["itunes:season"])
    const itemExplicit = pickText(item["itunes:explicit"]).toLowerCase()

    const id = slugify(title || guid).slice(0, 80) || "episode"

    return {
      id,
      title,
      description,
      publishedAt,
      duration,
      audioUrl,
      videoUrl,
      imageUrl: itEpisodeImage || null,
      episodeNumber: episodeNumberRaw ? parseInt(episodeNumberRaw, 10) || null : null,
      seasonNumber: seasonRaw ? parseInt(seasonRaw, 10) || null : null,
      explicit: ["yes", "true", "explicit"].includes(itemExplicit),
      episodeType,
      guid,
      link: pickText(item.link) || null,
    }
  })

  // de-duplicate episode ids
  const seen = new Map<string, number>()
  for (const e of episodes) {
    const n = (seen.get(e.id) ?? 0) + 1
    seen.set(e.id, n)
    if (n > 1) e.id = `${e.id}-${n}`
  }

  return {
    title: pickText(channel.title),
    description: pickText(channel.description),
    summary: pickText(channel["itunes:summary"]),
    subtitle: pickText(channel["itunes:subtitle"]),
    link: pickText(channel.link),
    author:
      pickText(channel["itunes:author"]) ||
      pickText(channel.author) ||
      pickText(channel["dc:creator"]),
    language: pickText(channel.language) || "en",
    image: itunesImage || fallbackImage,
    categories: flattenCategories(channel["itunes:category"]),
    explicit: isExplicit,
    copyright: pickText(channel.copyright),
    episodes,
  }
}

export async function fetchAndParseRss(url: string): Promise<ParsedFeed> {
  const xml = await fetchRss(url)
  return parseRss(xml)
}

export { slugify }
