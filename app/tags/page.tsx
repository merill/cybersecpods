import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import { getPopularTags } from "@/lib/podcasts"
import { TagSearch } from "@/components/tags/tag-search"

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
      <header className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tags</h1>
        <p className="mt-2 text-muted-foreground">
          Browse cybersecurity podcasts by topic. {tags.length} tags across the
          directory.
        </p>
      </header>

      <TagSearch tags={tags} />
    </div>
  )
}
