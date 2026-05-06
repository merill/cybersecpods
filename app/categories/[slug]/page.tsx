import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { siteConfig } from "@/config/site"
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_GROUPS,
  categoryLabel,
  groupForCategory,
  isCategorySlug,
} from "@/lib/categories"
import {
  categorySeoIntro,
  getBestPodcastPageForCategory,
  getRankedPodcastsForCategory,
} from "@/lib/editorial-seo"
import { getPodcastsByCategory } from "@/lib/podcasts"
import { DEFAULT_OG_IMAGES, itemListJsonLd } from "@/lib/seo"
import { PodcastCard } from "@/components/podcast/podcast-card"

interface PageProps {
  params: { slug: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  return CATEGORY_GROUPS.flatMap((g) => g.categories.map((slug) => ({ slug })))
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (!isCategorySlug(params.slug)) return {}
  const display = categoryLabel(params.slug)
  const desc = CATEGORY_DESCRIPTIONS[params.slug]
  const title = `${display} Cybersecurity Podcasts`
  return {
    title,
    description: `${desc}. Compare active ${display.toLowerCase()} cybersecurity podcasts by ratings, recency, and topic fit.`,
    alternates: {
      canonical: `${siteConfig.url}/categories/${params.slug}/`,
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description: desc,
      type: "website",
      url: `${siteConfig.url}/categories/${params.slug}/`,
      images: [...DEFAULT_OG_IMAGES],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description: desc,
      images: ["/og/default.png"],
    },
  }
}

export default function CategoryPage({ params }: PageProps) {
  if (!isCategorySlug(params.slug)) notFound()

  const podcasts = getPodcastsByCategory(params.slug)
  const active = getRankedPodcastsForCategory(params.slug, 1000)
  const inactive = podcasts.filter((p) => !p.isActive)
  const display = categoryLabel(params.slug)
  const description = CATEGORY_DESCRIPTIONS[params.slug]
  const group = groupForCategory(params.slug)
  const ranked = active.slice(0, 8)
  const url = `${siteConfig.url}/categories/${params.slug}/`
  const ld = itemListJsonLd(`${display} Cybersecurity Podcasts`, url, ranked)
  const rankingPage = getBestPodcastPageForCategory(params.slug)

  // Sibling categories from the same group, excluding self.
  const siblings = group
    ? group.categories.filter((s) => s !== params.slug)
    : []

  return (
    <div className="container py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <Link
        href="/categories/"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← All categories
      </Link>
      <header className="mb-8 max-w-3xl">
        {group ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {display}
        </h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {active.length} active podcast{active.length === 1 ? "" : "s"}
          {inactive.length ? ` · ${inactive.length} inactive` : ""}.
        </p>
      </header>

      <section className="mb-10 grid gap-6 border-y py-6 lg:grid-cols-[1fr_320px]">
        <div className="max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
          <p>{categorySeoIntro(params.slug)}</p>
          <p>
            The list below is designed for discovery rather than paid placement:
            active shows are surfaced first, with ranking signals from listener
            ratings, review volume, recent episodes, and category relevance.
          </p>
        </div>
        {ranked.length ? (
          <aside>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Top picks in {display}
            </h2>
            <ol className="mt-3 space-y-2">
              {ranked.slice(0, 5).map((podcast, index) => (
                <li key={podcast.id}>
                  <Link
                    href={`/podcasts/${podcast.id}/`}
                    className="flex items-center gap-2 rounded-md border bg-card/50 px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="line-clamp-1 font-medium">
                      {podcast.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            {rankingPage ? (
              <Link
                href={`/${rankingPage.slug}/`}
                className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
              >
                View the {rankingPage.title.toLowerCase()} ranking
              </Link>
            ) : null}
          </aside>
        ) : null}
      </section>

      {active.length === 0 && inactive.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No podcasts in this category yet.{" "}
          <Link href="/submit/" className="underline hover:text-foreground">
            Submit one
          </Link>
          .
        </p>
      ) : null}

      {active.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {active.map((p) => (
            <PodcastCard key={p.id} podcast={p} />
          ))}
        </div>
      ) : null}

      {inactive.length ? (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            Show {inactive.length} inactive podcast
            {inactive.length === 1 ? "" : "s"}
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4 opacity-70 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {inactive.map((p) => (
              <PodcastCard key={p.id} podcast={p} />
            ))}
          </div>
        </details>
      ) : null}

      {siblings.length ? (
        <section className="mt-12 border-t pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            More in {group?.label}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {siblings.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/categories/${slug}/`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                  {categoryLabel(slug)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
