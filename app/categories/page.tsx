import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { CATEGORY_GROUPS, categoryLabel } from "@/lib/categories"
import { getCategoryCounts } from "@/lib/podcasts"

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Browse cybersecurity podcasts by category — defensive operations, offensive security, application security, cloud, identity, leadership, and more.",
  alternates: { canonical: siteConfig.url + "/categories/" },
}

export default function CategoriesIndexPage() {
  const counts = new Map(getCategoryCounts().map((c) => [c.slug, c.count]))
  const totalCategories = CATEGORY_GROUPS.flatMap((g) => g.categories).length

  return (
    <div className="container py-8 md:py-12">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Categories
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse {totalCategories} cybersecurity categories across{" "}
          {CATEGORY_GROUPS.length} groups.
        </p>
      </header>

      <div className="space-y-10">
        {CATEGORY_GROUPS.map((group) => (
          <section key={group.slug}>
            <header className="mb-3">
              <h2 className="text-xl font-semibold tracking-tight">
                {group.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {group.description}
              </p>
            </header>
            <ul className="flex flex-wrap gap-2">
              {group.categories.map((slug) => {
                const count = counts.get(slug) ?? 0
                return (
                  <li key={slug}>
                    <Link
                      href={`/categories/${slug}/`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      {categoryLabel(slug)}
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {count}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
