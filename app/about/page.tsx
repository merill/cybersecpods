import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { getAllPodcasts, getAllTags, getLatestEpisodes } from "@/lib/podcasts"

export const metadata: Metadata = {
  title: "About",
  description:
    "About CyberSecPods — a curated, open-source directory of cybersecurity podcasts. Submit your show via GitHub.",
  alternates: { canonical: siteConfig.url + "/about/" },
}

export default function AboutPage() {
  const podcasts = getAllPodcasts()
  const active = podcasts.filter((p) => p.isActive)
  const tags = getAllTags()
  const episodes = getLatestEpisodes(1, { includeInactive: true })
  const totalEpisodes = podcasts.reduce((sum, p) => sum + p.episodeCount, 0)
  const lastUpdated = episodes[0]?.publishedAt

  return (
    <div className="container max-w-3xl py-12 md:py-16">
      <h1 className="text-4xl font-bold tracking-tight">About CyberSecPods</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        A curated, open-source directory of cybersecurity podcasts — built so
        defenders, researchers, and operators can quickly discover the shows
        worth listening to.
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-6 rounded-xl border bg-card/50 p-6 md:grid-cols-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active podcasts
          </dt>
          <dd className="mt-1 text-2xl font-bold">{active.length}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total podcasts
          </dt>
          <dd className="mt-1 text-2xl font-bold">{podcasts.length}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Episodes indexed
          </dt>
          <dd className="mt-1 text-2xl font-bold">
            {totalEpisodes.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tags
          </dt>
          <dd className="mt-1 text-2xl font-bold">{tags.length}</dd>
        </div>
      </dl>

      <section className="prose mt-10 max-w-none dark:prose-invert">
        <h2>How it works</h2>
        <p>
          CyberSecPods is a static site. The directory is a set of small JSON
          files in the GitHub repo, one per podcast, each pointing to an Apple
          Podcasts ID. A scheduled job pulls each show&apos;s RSS feed every
          hour to refresh episode metadata, and a daily job pulls the latest
          Apple ratings. The site rebuilds on every change and deploys via
          Cloudflare Pages.
        </p>

        <h2>Submit a podcast</h2>
        <p>
          Submissions are managed via pull request. Drop a JSON file at{" "}
          <code>@data/podcasts/&lt;your-slug&gt;.json</code> with at minimum:
        </p>
        <pre>
{`{
  "applePodcastId": "1296350360",
  "tags": ["threat-intelligence", "incident-response"]
}`}
        </pre>
        <p>
          A bot validates your PR (Apple ID resolves, RSS feed parses, tags are
          kebab-case). Optional fields include <code>spotifyUrl</code>,{" "}
          <code>websiteUrl</code>, <code>youtubeUrl</code>,{" "}
          <code>twitterUrl</code>, <code>linkedinUrl</code>,{" "}
          <code>authors</code> (with per-author socials), and{" "}
          <code>featured</code>.
        </p>
        <p>
          See the{" "}
          <Link
            href={siteConfig.links.github}
            className="font-medium underline"
          >
            GitHub repo
          </Link>{" "}
          for the full schema and example submissions.
        </p>

        <h2>Inactive podcasts</h2>
        <p>
          A podcast is marked inactive when it hasn&apos;t published a new
          episode in 60 days. Inactive shows are hidden by default but stay
          listed under their tags so historical episodes remain discoverable.
        </p>

        <h2>Privacy</h2>
        <p>
          No tracking, no cookies, no accounts. Audio and video stream directly
          from each podcast&apos;s host — we never proxy or store media.
        </p>

        <h2>Credits</h2>
        <p>
          Built and maintained by{" "}
          <Link
            href={siteConfig.links.twitter}
            className="font-medium underline"
          >
            Merill Fernando
          </Link>
          . Contributions welcome.
        </p>
      </section>

      {lastUpdated ? (
        <p className="mt-12 text-xs text-muted-foreground">
          Last updated {new Date(lastUpdated).toUTCString()}
        </p>
      ) : null}
    </div>
  )
}
