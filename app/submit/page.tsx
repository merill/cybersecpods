import type { Metadata } from "next"
import { Suspense } from "react"

import { siteConfig } from "@/config/site"
import { getAllPodcasts, getAllTags } from "@/lib/podcasts"
import { SubmitForm } from "@/components/submit/submit-form"

export const metadata: Metadata = {
  title: "Submit or edit a podcast",
  description:
    "Add a cybersecurity podcast to the directory, or suggest edits to an existing one. Open-source — submissions go through GitHub.",
  alternates: { canonical: siteConfig.url + "/submit/" },
  robots: { index: true, follow: true },
}

function parseRepoFromUrl(url: string): { owner: string; name: string } {
  // Expect https://github.com/<owner>/<repo>
  try {
    const u = new URL(url)
    const [, owner, name] = u.pathname.split("/")
    if (owner && name) return { owner, name }
  } catch {
    /* ignore */
  }
  return { owner: "merill", name: "cybersecpods" }
}

export default function SubmitPage() {
  const podcasts = getAllPodcasts()
  const existingSlugs = podcasts.map((p) => p.id)
  const knownTags = getAllTags()
  const repo = parseRepoFromUrl(siteConfig.links.github)

  return (
    <div className="container">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <SubmitForm
          existingSlugs={existingSlugs}
          knownTags={knownTags}
          repo={repo}
        />
      </Suspense>
    </div>
  )
}
