# CyberSecPods

A curated, open-source directory of cybersecurity podcasts — built so defenders, researchers, CISOs, and operators can quickly discover the shows worth listening to. Live at **[cybersecpods.com](https://cybersecpods.com)**.

> 50+ shows, 20,000+ episodes indexed, hourly RSS refresh, daily Apple ratings refresh, full search, tag filtering, audio + video player, JSON-LD SEO. Static site, hosted on Cloudflare Pages.

---

## How submissions work

Each podcast lives in a tiny JSON file under [`@data/podcasts/`](./@data/podcasts/). The build job pulls each show's RSS feed, hydrates the rest of the metadata, and the site rebuilds.

**The only required field is `applePodcastId`** — everything else (RSS URL, website, host, image, description) is auto-filled from Apple Podcasts and the RSS feed.

### Submit or edit a podcast (recommended: in-browser form)

The easiest way is at **[cybersecpods.com/submit/](https://cybersecpods.com/submit/)**.

1. Paste the Apple Podcasts ID — the form looks the show up live and confirms it found the right one.
2. Fill in the optional details (tags, hosts, social links). Tags autocomplete from existing categories.
3. Click **Open GitHub issue**. You're sent to a pre-filled GitHub Issue with a one-click submit button.
4. A bot validates the JSON, opens a PR for review, and links it back on the issue. Maintainers merge.

To **suggest edits** to an existing podcast, click "Suggest edits" on the podcast page (or visit `/submit/?slug=<slug>`). The form pre-fills from the current entry.

You need a free GitHub account to submit (the issue is filed under your account so you get notifications when the PR opens / merges). No coding or git knowledge required.

### Submit a podcast (alternative: direct Pull Request)

If you'd rather skip the form:

1. Fork the repo.
2. Create `@data/podcasts/<your-slug>.json`. The slug must be **kebab-case** and becomes the URL: `cybersecpods.com/podcasts/<your-slug>/`.
3. Open a PR. The validate-pr workflow checks your submission and posts results as a PR comment within ~30s. Once it's green, a maintainer will merge.

### Minimum example

```json
{
  "applePodcastId": "1296350360",
  "tags": ["threat-intelligence", "incident-response"]
}
```

That's it — the title, description, image, RSS URL, hosts, and Apple ratings are all derived automatically.

### Full example with all optional fields

```json
{
  "applePodcastId": "1296350360",
  "spotifyUrl": "https://open.spotify.com/show/4XPl3uEEL9hvqMkoZrzbx5",
  "websiteUrl": "https://darknetdiaries.com/",
  "rssUrl": "https://feeds.megaphone.fm/darknetdiaries",
  "youtubeUrl": "https://www.youtube.com/@JackRhysider",
  "twitterUrl": "https://twitter.com/JackRhysider",
  "linkedinUrl": "https://www.linkedin.com/company/darknet-diaries/",
  "tags": ["true-crime", "hacking", "osint"],
  "authors": [
    {
      "name": "Jack Rhysider",
      "twitterUrl": "https://twitter.com/JackRhysider",
      "linkedinUrl": "https://www.linkedin.com/in/jackrhysider/",
      "websiteUrl": "https://jackrhysider.com"
    }
  ],
  "featured": true,
  "submittedBy": "your-github-handle"
}
```

### Field reference

| Field             | Required | Description                                                                                           |
| ----------------- | :------: | ----------------------------------------------------------------------------------------------------- |
| `applePodcastId`  |   Yes    | Apple Podcasts numeric ID (digits only, **no `id` prefix**). E.g. `1296350360`.                       |
| `tags`            |    No    | Free-form list of **kebab-case** tags. E.g. `["threat-intelligence","ciso"]`.                         |
| `spotifyUrl`      |    No    | Full `https://open.spotify.com/show/...` URL. Used for deep-link only — Spotify ratings are not used. |
| `websiteUrl`      |    No    | Podcast homepage. Falls back to RSS `<link>`.                                                         |
| `rssUrl`          |    No    | Override the RSS feed (Apple's `feedUrl` is used by default).                                         |
| `youtubeUrl`      |    No    | YouTube channel/show URL.                                                                             |
| `twitterUrl`      |    No    | X/Twitter URL for the show (host links go in `authors`).                                              |
| `linkedinUrl`     |    No    | LinkedIn URL.                                                                                         |
| `authors`         |    No    | Array of `{ name, twitterUrl?, linkedinUrl?, websiteUrl? }`.                                          |
| `submittedBy`     |    No    | Your GitHub handle (for credit).                                                                      |

### Validation rules

- **Filename** must be kebab-case (`darknet-diaries.json`, not `DarknetDiaries.json` or `darknet_diaries.json`).
- **`applePodcastId`** must be 6–12 digits only, and must resolve via the Apple iTunes Lookup API.
- **`tags`** must each match `^[a-z0-9]+(-[a-z0-9]+)*$`.
- **Social URLs** are host-restricted (Twitter/X, LinkedIn, YouTube, Spotify, Apple).
- **Duplicate `applePodcastId`** across files is rejected.
- The RSS feed must successfully parse and have a non-empty `<title>`.

A podcast is automatically marked **inactive** if no episode has been published in the last 60 days. Inactive shows are hidden by default but stay listed under their tags.

---

## Local development

```bash
# Install deps
npm install

# Refresh all podcast metadata + episodes (network calls)
npm run update:podcasts

# Refresh Apple ratings (network calls)
npm run update:ratings

# Validate input files (set SKIP_NETWORK=1 for offline dry-run)
SKIP_NETWORK=1 npm run validate:input

# Dev server
npm run dev

# Production build (refreshes podcasts then exports the static site)
npm run build
```

Outputs:

- `@data/podcasts.json` — hydrated podcast metadata (gitignored intermediate? actually committed for static export)
- `@data/episodes/<slug>.json` — per-podcast episode list
- `@data/ratings.json` — Apple ratings cache
- `public/podcasts-index.json` — slim search index served to the browser
- `out/` — static site output

---

## Architecture

| Concern               | Implementation                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Hosting               | Cloudflare Pages (auto-deploys on every push to `main` via Git integration — no API tokens). |
| Framework             | Next.js 14 App Router, `output: "export"`, `trailingSlash: true`.                             |
| RSS / Apple lookups   | `fast-xml-parser` + `node:fetch`, with on-disk cache and 429 backoff (`@build/lib/`).         |
| Search                | `fuse.js` over a slim JSON index served from `/podcasts-index.json`.                          |
| Audio + video player  | [`media-chrome`](https://media-chrome.org/) custom elements (audio + video, with chapters).  |
| Theme                 | `next-themes` (light + dark + system).                                                        |
| Carousel              | `embla-carousel-react` + `embla-carousel-autoplay`.                                           |
| Animations            | `framer-motion`.                                                                              |
| Command palette       | `cmdk` (⌘K).                                                                                  |
| Validation            | `zod` schemas under `@build/lib/zod-schemas.ts`.                                              |
| SEO                   | Per-page metadata + JSON-LD (`PodcastSeries`, `PodcastEpisode`, `WebSite`).                   |

### Refresh schedule (GitHub Actions)

| Workflow                                       | Cron                  | What it does                                                                          |
| ---------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| `.github/workflows/update-episodes.yml`        | `15 * * * *` (hourly) | Re-runs `update:podcasts`, commits `@data/*` if changed → CF Pages auto-deploys.       |
| `.github/workflows/update-ratings.yml`         | `0 6 * * *` (daily)   | Re-fetches Apple ratings, then re-bakes them into `podcasts.json`.                     |
| `.github/workflows/validate-pr.yml`            | on PR                 | Validates changed `@data/podcasts/*.json` files and posts results as a sticky comment. |
| `.github/workflows/process-submission.yml`     | on issue              | Parses submissions filed via the in-browser form, validates, and opens a PR.           |

### Cloudflare Pages setup

The Pages project is wired to this GitHub repo with the following settings:

- **Framework preset**: None
- **Build command**: `npm run build:site`
- **Build output directory**: `out`
- **Node version**: `20`

Note: `build:site` runs only `next build` and assumes the `@data/*` files are already committed (refreshed by the hourly Action). For local `npm run build` (which both refreshes data AND builds), use `npm run build`.

### Folder layout

```
@build/                # Build-time TypeScript: RSS parser, Apple lookup, validators
@data/
  podcasts/            # ← User-submitted JSON (PR target)
  podcasts.json        # ← Generated: hydrated metadata for all podcasts
  episodes/            # ← Generated: per-podcast episode JSON (gitignored)
  ratings.json         # ← Generated: Apple ratings cache (gitignored)
app/                   # Next.js routes
components/            # React components
lib/                   # Runtime helpers (data accessors, SEO, search, utils)
public/                # Static assets, including podcasts-index.json
```

---

## Privacy

No tracking, no cookies, no accounts. Audio and video stream directly from each podcast's host — we never proxy or store media.

## License & credits

Built and maintained by [Merill Fernando](https://twitter.com/merill). Contributions welcome — open an issue or PR.
