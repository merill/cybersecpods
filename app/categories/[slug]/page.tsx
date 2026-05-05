import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { siteConfig } from "@/config/site"
import {
  CATEGORY_GROUPS,
  CATEGORY_DESCRIPTIONS,
  categoryLabel,
  groupForCategory,
  isCategorySlug,
} from "@/lib/categories"
import { getPodcastsByCategory } from "@/lib/podcasts"
import { PodcastCard } from "@/components/podcast/podcast-card"

interface PageProps {
  params: { slug: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  return CATEGORY_GROUPS.flatMap((g) =>
    g.categories.map((slug) => ({ slug }))
  )
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (!isCategorySlug(params.slug)) return {}
  const display = categoryLabel(params.slug)
  const desc = CATEGORY_DESCRIPTIONS[params.slug]
  return {
    title: `${display} Podcasts`,
    description: `${desc} — curated cybersecurity podcasts.`,
    alternates: {
      canonical: `${siteConfig.url}/categories/${params.slug}/`,
    },
    openGraph: {
      title: `${display} Cybersecurity Podcasts | ${siteConfig.name}`,
      description: desc,
      type: "website",
      url: `${siteConfig.url}/categories/${params.slug}/`,
    },
  }
}

export default function CategoryPage({ params }: PageProps) {
  if (!isCategorySlug(params.slug)) notFound()

  const podcasts = getPodcastsByCategory(params.slug)
  const active = podcasts.filter((p) => p.isActive)
  const inactive = podcasts.filter((p) => !p.isActive)
  const display = categoryLabel(params.slug)
  const description = CATEGORY_DESCRIPTIONS[params.slug]
  const group = groupForCategory(params.slug)

  // Sibling categories from the same group, excluding self.
  const siblings = group
    ? group.categories.filter((s) => s !== params.slug)
    : []

  return (
    <div className="container py-8 md:py-12">
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
