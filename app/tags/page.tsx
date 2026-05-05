import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { getPopularTags } from "@/lib/podcasts"
import { displayTag } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Tags",
  description:
    "Browse cybersecurity podcasts by topic — cloud security, threat intelligence, identity, governance, hacking, and more.",
  alternates: { canonical: siteConfig.url + "/tags/" },
}

export default function TagsIndexPage() {
  const tags = getPopularTags(1)
  return (
    <div className="container py-8 md:py-12">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tags</h1>
        <p className="mt-2 text-muted-foreground">
          Browse cybersecurity podcasts by topic. {tags.length} tags across the
          directory.
        </p>
      </header>

      <ul className="flex flex-wrap gap-2">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              href={`/tags/${tag}/`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              {displayTag(tag)}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
