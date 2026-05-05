import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { siteConfig } from "@/config/site"
import {
  getAllTags,
  getPodcastsByTag,
  getPopularTags,
} from "@/lib/podcasts"
import { displayTag } from "@/lib/utils"
import { PodcastCard } from "@/components/podcast/podcast-card"

interface PageProps {
  params: { tag: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const display = displayTag(params.tag)
  return {
    title: `${display} Podcasts`,
    description: `Cybersecurity podcasts tagged with ${display} — curated and ranked.`,
    alternates: { canonical: `${siteConfig.url}/tags/${params.tag}/` },
    openGraph: {
      title: `${display} Cybersecurity Podcasts | ${siteConfig.name}`,
      description: `Browse cybersecurity podcasts tagged with ${display}.`,
      type: "website",
      url: `${siteConfig.url}/tags/${params.tag}/`,
    },
  }
}

export default function TagPage({ params }: PageProps) {
  const podcasts = getPodcastsByTag(params.tag)
  if (!podcasts.length) notFound()

  const active = podcasts.filter((p) => p.isActive)
  const inactive = podcasts.filter((p) => !p.isActive)
  const display = displayTag(params.tag)
  const related = getPopularTags(2)
    .filter((t) => t.tag !== params.tag)
    .slice(0, 12)

  return (
    <div className="container py-8 md:py-12">
      <Link
        href="/tags/"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← All tags
      </Link>
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {display}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {active.length} active podcast{active.length === 1 ? "" : "s"}
          {inactive.length ? ` · ${inactive.length} inactive` : ""} tagged
          with{" "}
          <span className="font-medium text-foreground">{display}</span>.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {active.map((p) => (
          <PodcastCard key={p.id} podcast={p} />
        ))}
      </div>

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

      {related.length ? (
        <section className="mt-12 border-t pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Related tags
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map(({ tag, count }) => (
              <li key={tag}>
                <Link
                  href={`/tags/${tag}/`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                  {displayTag(tag)}
                  <span className="text-xs text-muted-foreground">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
