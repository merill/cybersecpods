/**
 * Build-time generator for OpenGraph / Twitter share-card images.
 *
 * Produces 1200x630 PNGs in `public/og/`:
 *   - default.png         : generic site card (used by /, /about, /tags, etc.)
 *   - podcasts/<slug>.png : per-podcast card with artwork + title + author
 *
 * Episode pages re-use the parent podcast's OG image — the episode title is
 * already conveyed via the `og:title` text field on social cards, and
 * generating ~20k episode PNGs would balloon the static export size.
 *
 * Strategy: generate an SVG document for the layout (gradient background,
 * branding, title text, etc.) then composite the podcast artwork onto it
 * with sharp. Output as PNG.
 *
 * No external Wasm/canvas dep needed — sharp can rasterise SVG and composite
 * raster images. Text is placed in SVG <text> elements with a system font
 * fallback stack; we don't ship a custom font (avoids embedding a font
 * binary in the repo), accepting that the share-card will use whatever
 * sans-serif the rendering pipeline picks. In practice sharp+librsvg both
 * fall back to DejaVu/Liberation Sans on Linux CI which renders well.
 */

import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

import type { Podcast } from "../types/podcast"

const ROOT = process.cwd()
const PODCASTS_FILE = path.join(ROOT, "@data", "podcasts.json")
const OG_DIR = path.join(ROOT, "public", "og")
const OG_PODCASTS_DIR = path.join(OG_DIR, "podcasts")
const ARTWORK_CACHE_DIR = path.join(ROOT, "@data", ".cache", "og-artwork")

const WIDTH = 1200
const HEIGHT = 630
// Artwork is the visual hero. Sized to leave a healthy 40px top/bottom margin
// (HEIGHT - 80 = 550). Horizontally centered in the left half of the card so
// the gap on its left edge and the gap to the title text are equal at 50px
// (ARTWORK_X = 50, TEXT_X = 650).
const ARTWORK_SIZE = 550
const ARTWORK_RADIUS = 24 // rounded-corner radius applied via SVG mask
const TEXT_X = 650
const ARTWORK_X = (TEXT_X - ARTWORK_SIZE) / 2 // 50
const ARTWORK_Y = (HEIGHT - ARTWORK_SIZE) / 2 // 40
const TEXT_RIGHT_PAD = 60
const TEXT_W = WIDTH - TEXT_X - TEXT_RIGHT_PAD // 490

// ----- text helpers ---------------------------------------------------------

/**
 * Word-wrap a string to fit a maximum number of characters per line, returning
 * up to `maxLines` lines. Adds an ellipsis to the last line if truncated.
 *
 * Char-width is approximated; the SVG renderer takes care of the real glyph
 * placement. Tuned empirically against DejaVu Sans at the given font sizes.
 */
function wrap(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const w of words) {
    const candidate = current ? current + " " + w : w
    if (candidate.length <= maxCharsPerLine) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = w
      if (lines.length === maxLines) break
    }
  }
  if (lines.length < maxLines && current) lines.push(current)
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    // Add ellipsis to last line
    const last = lines[lines.length - 1]
    lines[lines.length - 1] =
      last.length > 3 ? last.slice(0, last.length - 1) + "…" : last
  }
  return lines
}

/** Escape XML special chars for safe inclusion in SVG text nodes. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// ----- artwork fetch+resize -------------------------------------------------

async function fetchArtwork(url: string, slug: string): Promise<Buffer | null> {
  if (!url) return null
  if (!fs.existsSync(ARTWORK_CACHE_DIR)) {
    fs.mkdirSync(ARTWORK_CACHE_DIR, { recursive: true })
  }
  const cacheFile = path.join(ARTWORK_CACHE_DIR, `${slug}.png`)
  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile)
  }
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; cybersecpods-og-builder/1.0; +https://cybersecpods.com)",
      },
    })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())

    // Resize to ARTWORK_SIZE square, then apply a rounded-corner mask via an
    // SVG rect alpha mask composited with `dest-in`. The result has true
    // transparent corners and composites cleanly onto the card background.
    const resizedBuf = await sharp(buf)
      .resize(ARTWORK_SIZE, ARTWORK_SIZE, { fit: "cover" })
      .png()
      .toBuffer()

    const maskSvg = Buffer.from(
      `<svg width="${ARTWORK_SIZE}" height="${ARTWORK_SIZE}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${ARTWORK_SIZE}" height="${ARTWORK_SIZE}" rx="${ARTWORK_RADIUS}" ry="${ARTWORK_RADIUS}" fill="#fff"/></svg>`
    )
    const rounded = await sharp(resizedBuf)
      .composite([{ input: maskSvg, blend: "dest-in" }])
      .png()
      .toBuffer()

    fs.writeFileSync(cacheFile, rounded)
    return rounded
  } catch {
    return null
  }
}

// ----- SVG templates --------------------------------------------------------

const FONT_STACK =
  '"Inter","Helvetica Neue","Helvetica","Arial","DejaVu Sans","Liberation Sans",sans-serif'

interface CardOpts {
  /** Top-of-card eyebrow, e.g. "PODCAST" or "EPISODE". */
  eyebrow?: string
  /** Main title (will be wrapped + ellipsised). */
  title: string
  /** Optional secondary line under title (e.g. show name on episode card). */
  subtitle?: string
  /** Optional small caption at bottom (e.g. author, tags). */
  caption?: string
  /** If true, omit artwork slot entirely (centered text card). */
  noArtwork?: boolean
}

function buildSvg(opts: CardOpts): string {
  const { eyebrow, title, subtitle, caption, noArtwork = false } = opts
  // Layout (with artwork):
  //   eyebrow:  near top, smallish, accent-colour
  //   title:    up to 3 lines, 52px (text column is 490px wide with 550x550
  //             artwork to its left)
  //   subtitle: 26px, 1 line
  //   caption:  20px, 1 line, muted
  // Layout (no artwork — default site card):
  //   centered, larger title; no eyebrow shown.
  const titleSize = noArtwork ? 72 : 52
  const titleLineHeight = Math.round(titleSize * 1.2)
  const titleMaxChars = noArtwork ? 28 : 20
  const titleLines = wrap(title, titleMaxChars, 3)

  const eyebrowY = noArtwork ? 200 : 90
  const titleY = eyebrow ? eyebrowY + (noArtwork ? 60 : 70) : 220
  const subtitleY = titleY + titleLineHeight * titleLines.length + 24
  const captionY = HEIGHT - 80

  // Centered text positioning when no artwork (default site card)
  const textX = noArtwork ? WIDTH / 2 : TEXT_X
  const textAnchor = noArtwork ? "middle" : "start"

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a23"/>
      <stop offset="50%" stop-color="#1a1a3e"/>
      <stop offset="100%" stop-color="#2d1b4e"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>

  ${eyebrow ? `<text x="${textX}" y="${eyebrowY}" text-anchor="${textAnchor}" font-family='${FONT_STACK}' font-size="22" font-weight="700" fill="#a78bfa" letter-spacing="3">${escapeXml(eyebrow)}</text>` : ""}

  <!-- title -->
  ${titleLines
    .map(
      (line, i) =>
        `<text x="${textX}" y="${titleY + i * titleLineHeight}" text-anchor="${textAnchor}" font-family='${FONT_STACK}' font-size="${titleSize}" font-weight="700" fill="#ffffff" letter-spacing="-1.5">${escapeXml(line)}</text>`
    )
    .join("\n  ")}

  ${subtitle ? `<text x="${textX}" y="${subtitleY}" text-anchor="${textAnchor}" font-family='${FONT_STACK}' font-size="26" font-weight="500" fill="#cbd5e1">${escapeXml(wrap(subtitle, noArtwork ? 50 : 32, 1)[0] || "")}</text>` : ""}

  ${caption ? `<text x="${textX}" y="${captionY}" text-anchor="${textAnchor}" font-family='${FONT_STACK}' font-size="20" font-weight="500" fill="#a3a3c2">${escapeXml(wrap(caption, noArtwork ? 60 : 32, 1)[0] || "")}</text>` : ""}

  <!-- bottom-right corner URL -->
  <text x="${WIDTH - 60}" y="${HEIGHT - 40}" text-anchor="end" font-family='${FONT_STACK}' font-size="20" font-weight="600" fill="#a78bfa">
    CyberSecPods<tspan fill="#7c3aed">.com</tspan>
  </text>
</svg>`
}

// ----- composite + write ----------------------------------------------------

async function renderCard(
  outFile: string,
  artworkUrl: string | null,
  artworkCacheKey: string,
  opts: CardOpts
): Promise<boolean> {
  const svg = buildSvg(opts)
  const svgBuf = Buffer.from(svg)

  // density:72 keeps the SVG rasterised at native pixel dimensions (1200x630).
  // A higher density (e.g. 144) doubles the canvas to 2400x1260 but leaves
  // any composited raster artwork at its real pixel size, making it look
  // tiny relative to the upscaled background.
  let pipeline = sharp(svgBuf, { density: 72 })

  if (!opts.noArtwork && artworkUrl) {
    const art = await fetchArtwork(artworkUrl, artworkCacheKey)
    if (art) {
      pipeline = pipeline.composite([
        { input: art, left: ARTWORK_X, top: ARTWORK_Y },
      ])
    }
  }

  try {
    await pipeline.png({ compressionLevel: 9 }).toFile(outFile)
    return true
  } catch (e) {
    console.warn(`OG render failed for ${outFile}: ${(e as Error).message}`)
    return false
  }
}

// ----- entry points ---------------------------------------------------------

export async function generateDefaultCard(): Promise<void> {
  if (!fs.existsSync(OG_DIR)) fs.mkdirSync(OG_DIR, { recursive: true })
  await renderCard(
    path.join(OG_DIR, "default.png"),
    null,
    "default",
    {
      title: "The Cybersecurity Podcast Directory",
      subtitle:
        "Discover the best podcasts on cyber, threat intel, identity & cloud security",
      noArtwork: true,
    }
  )
}

export async function generatePodcastCard(podcast: Podcast): Promise<void> {
  if (!fs.existsSync(OG_PODCASTS_DIR)) {
    fs.mkdirSync(OG_PODCASTS_DIR, { recursive: true })
  }
  const out = path.join(OG_PODCASTS_DIR, `${podcast.id}.png`)
  await renderCard(out, podcast.image, podcast.id, {
    eyebrow: "PODCAST",
    title: podcast.title,
    subtitle: podcast.author || undefined,
    caption: podcast.tags.length
      ? podcast.tags
          .slice(0, 4)
          .map((t) => "#" + t)
          .join("  ")
      : podcast.categories.slice(0, 2).join(" · ") || undefined,
  })
}

// ----- CLI ------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Generating OG share-card images...")
  if (!fs.existsSync(OG_DIR)) fs.mkdirSync(OG_DIR, { recursive: true })

  // 1. default site card
  await generateDefaultCard()
  console.log("  ✓ default.png")

  // 2. per-podcast cards (episode pages re-use these — no per-episode cards)
  const podcasts = JSON.parse(
    fs.readFileSync(PODCASTS_FILE, "utf8")
  ) as Podcast[]
  let done = 0
  for (const p of podcasts) {
    await generatePodcastCard(p)
    done++
    if (done % 10 === 0 || done === podcasts.length) {
      console.log(`  ✓ podcasts ${done}/${podcasts.length}`)
    }
  }

  console.log(`\n✓ Generated ${podcasts.length} podcast cards.`)
}

// Only run main() when this file is executed directly (e.g. `tsx generate-og-images.ts`),
// not when imported as a module. Guard works for both ESM and CJS via the
// `process.argv[1]` filename check.
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)
if (isDirectRun) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
