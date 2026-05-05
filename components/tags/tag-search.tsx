"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { Icons } from "@/components/icons"
import { displayTag } from "@/lib/utils"

interface TagSearchProps {
  tags: Array<{ tag: string; count: number }>
}

export function TagSearch({ tags }: TagSearchProps) {
  const [query, setQuery] = useState("")
  const trimmed = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!trimmed) return tags
    return tags.filter((t) => {
      // Match against the kebab tag itself OR the display version
      // (so "threat intel" matches "threat-intel" tag).
      const display = displayTag(t.tag).toLowerCase()
      return t.tag.toLowerCase().includes(trimmed) || display.includes(trimmed)
    })
  }, [tags, trimmed])

  return (
    <>
      <div className="relative mb-6 max-w-md">
        <Icons.search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tags…"
          aria-label="Search tags"
          className="w-full rounded-md border bg-background py-2 pl-9 pr-9 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tags match <span className="font-medium">{query}</span>.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {filtered.map(({ tag, count }) => (
            <li key={tag}>
              <Link
                href={`/categories/${tag}/`}
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
      )}

      {trimmed && filtered.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {tags.length} tags
        </p>
      ) : null}
    </>
  )
}
