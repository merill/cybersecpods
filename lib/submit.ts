import slugifyLib from "slugify"

import type { Author, PodcastInput } from "@/types/podcast"

export function clientSlugify(s: string): string {
  return (slugifyLib as unknown as (s: string, opts?: object) => string)(s, {
    lower: true,
    strict: true,
    trim: true,
  })
}

/** Build the canonical PodcastInput JSON from form state, omitting empty values. */
export function buildPodcastInputJson(state: PodcastFormState): PodcastInput {
  const out: PodcastInput = {
    applePodcastId: state.applePodcastId.trim(),
  }
  if (state.spotifyUrl.trim()) out.spotifyUrl = state.spotifyUrl.trim()
  if (state.websiteUrl.trim()) out.websiteUrl = state.websiteUrl.trim()
  if (state.rssUrl.trim()) out.rssUrl = state.rssUrl.trim()
  if (state.youtubeUrl.trim()) out.youtubeUrl = state.youtubeUrl.trim()
  if (state.twitterUrl.trim()) out.twitterUrl = state.twitterUrl.trim()
  if (state.linkedinUrl.trim()) out.linkedinUrl = state.linkedinUrl.trim()

  const tags = state.tags
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (tags.length) out.tags = tags

  const authors: Author[] = []
  for (const a of state.authors) {
    const name = a.name.trim()
    if (!name) continue
    const obj: Author = { name }
    if (a.twitterUrl.trim()) obj.twitterUrl = a.twitterUrl.trim()
    if (a.linkedinUrl.trim()) obj.linkedinUrl = a.linkedinUrl.trim()
    if (a.websiteUrl.trim()) obj.websiteUrl = a.websiteUrl.trim()
    authors.push(obj)
  }
  if (authors.length) out.authors = authors

  if (state.submittedBy.trim()) out.submittedBy = state.submittedBy.trim()
  return out
}

export interface PodcastFormState {
  slug: string
  applePodcastId: string
  spotifyUrl: string
  websiteUrl: string
  rssUrl: string
  youtubeUrl: string
  twitterUrl: string
  linkedinUrl: string
  tags: string[]
  authors: AuthorFormState[]
  submittedBy: string
}

export interface AuthorFormState {
  name: string
  twitterUrl: string
  linkedinUrl: string
  websiteUrl: string
}

export function emptyAuthor(): AuthorFormState {
  return { name: "", twitterUrl: "", linkedinUrl: "", websiteUrl: "" }
}

export function emptyFormState(): PodcastFormState {
  return {
    slug: "",
    applePodcastId: "",
    spotifyUrl: "",
    websiteUrl: "",
    rssUrl: "",
    youtubeUrl: "",
    twitterUrl: "",
    linkedinUrl: "",
    tags: [],
    authors: [],
    submittedBy: "",
  }
}

export function fromPodcastInput(
  slug: string,
  input: PodcastInput
): PodcastFormState {
  return {
    slug,
    applePodcastId: input.applePodcastId ?? "",
    spotifyUrl: input.spotifyUrl ?? "",
    websiteUrl: input.websiteUrl ?? "",
    rssUrl: input.rssUrl ?? "",
    youtubeUrl: input.youtubeUrl ?? "",
    twitterUrl: input.twitterUrl ?? "",
    linkedinUrl: input.linkedinUrl ?? "",
    tags: input.tags ?? [],
    authors: (input.authors ?? []).map((a) => ({
      name: a.name ?? "",
      twitterUrl: a.twitterUrl ?? "",
      linkedinUrl: a.linkedinUrl ?? "",
      websiteUrl: a.websiteUrl ?? "",
    })),
    submittedBy: input.submittedBy ?? "",
  }
}

export interface AppleLookupResult {
  collectionName: string
  artistName: string
  artworkUrl600?: string
  feedUrl?: string
  trackViewUrl?: string
  primaryGenreName?: string
}

/**
 * Look up an Apple Podcast ID using the public iTunes Lookup API.
 *
 * IMPORTANT: Apple's lookup endpoint only sets `access-control-allow-origin`
 * when a `callback` query parameter is present (the endpoint was designed
 * for JSONP-style use). Without it, browsers block the cross-origin response
 * and the user sees "Failed to fetch". Passing `callback=` (empty value) is
 * a known trick: Apple sets the CORS headers AND returns plain JSON instead
 * of a JSONP wrapper.
 */
export async function lookupApple(
  applePodcastId: string,
  signal?: AbortSignal
): Promise<AppleLookupResult | null> {
  const id = applePodcastId.trim()
  if (!/^\d{6,12}$/.test(id)) {
    throw new Error("Apple ID must be 6-12 digits (no 'id' prefix).")
  }
  const url = `https://itunes.apple.com/lookup?id=${id}&entity=podcast&callback=`
  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`Apple lookup failed (HTTP ${res.status}).`)
  }
  // Apple returns `text/javascript` as the content-type even with an empty
  // callback, so res.json() would refuse to parse it. Use text() and
  // JSON.parse manually. The body has leading whitespace/newlines that
  // JSON.parse handles fine.
  const text = await res.text()
  let json: { resultCount: number; results: AppleLookupResult[] }
  try {
    json = JSON.parse(text.trim())
  } catch {
    throw new Error("Apple lookup returned a malformed response.")
  }
  if (!json.resultCount || !json.results?.length) return null
  return json.results[0]
}
