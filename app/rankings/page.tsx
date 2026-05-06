import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import {
  BEST_PODCAST_PAGES,
  getRankedPodcastsForPage,
} from "@/lib/editorial-seo"
import { DEFAULT_OG_IMAGES, itemListJsonLd } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Cybersecurity Podcast Rankings",
  description:
    "Browse curated CyberSecPods rankings for cybersecurity, cloud security, identity security, threat intelligence, AppSec, and CISO podcasts.",
  alternates: { canonical: `${siteConfig.url}/rankings/` },
  openGraph: {
    title: `Cybersecurity Podcast Rankings | ${siteConfig.name}`,
    description:
      "Curated cybersecurity podcast rankings by topic, audience, and security discipline.",
    url: `${siteConfig.url}/rankings/`,
    type: "website",
    images: [...DEFAULT_OG_IMAGES],
  },
  twitter: {
    card: "summary_large_image",
    title: `Cybersecurity Podcast Rankings | ${siteConfig.name}`,
    description:
      "Curated cybersecurity podcast rankings by topic, audience, and security discipline.",
    images: ["/og/default.png"],
  },
}

export default function RankingsPage() {
  const topPages = BEST_PODCAST_PAGES.map((page) => ({
    page,
    podcasts: getRankedPodcastsForPage(page, 3),
  }))
  const ld = itemListJsonLd(
    "Cybersecurity Podcast Rankings",
    `${siteConfig.url}/rankings/`,
    topPages.flatMap(({ podcasts }) => podcasts).slice(0, 20)
  )

  return (
    <article className="container py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          CyberSecPods rankings
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
          Cybersecurity Podcast Rankings
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Curated podcast lists for security practitioners, leaders, engineers,
          and teams who want the right shows for their role or topic.
        </p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {topPages.map(({ page, podcasts }) => (
          <section key={page.slug} className="rounded-lg border bg-card/50 p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              <Link href={`/${page.slug}/`} className="hover:text-primary">
                {page.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {page.description}
            </p>
            {podcasts.length ? (
              <ol className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {podcasts.map((podcast, index) => (
                  <li key={podcast.id}>
                    <Link
                      href={`/podcasts/${podcast.id}/`}
                      className="hover:text-foreground hover:underline"
                    >
                      #{index + 1} {podcast.title}
                    </Link>
                  </li>
                ))}
              </ol>
            ) : null}
            <Link
              href={`/${page.slug}/`}
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              View the full ranking
            </Link>
          </section>
        ))}
      </div>

      <section className="mt-10 max-w-3xl border-t pt-8">
        <h2 className="text-lg font-semibold tracking-tight">
          How the rankings work
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Each ranking blends listener ratings, review volume, publishing
          activity, episode depth, and topic fit. The lists refresh from the
          CyberSecPods directory as podcast data changes.
        </p>
      </section>
    </article>
  )
}
