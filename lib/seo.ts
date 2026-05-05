import type { Metadata } from "next"
import type { Podcast, Episode } from "@/types/podcast"
import { siteConfig } from "@/config/site"

// Site-wide default OG share-card. Re-exported here so any route that needs to
// redefine `openGraph` can spread these images back in — Next.js metadata
// shallow-merges `openGraph`, so omitting `images` in a route override drops
// the layout's image entirely.
export const DEFAULT_OG_IMAGE_URL = "/og/default.png" as const

export const DEFAULT_OG_IMAGES = [
  {
    url: DEFAULT_OG_IMAGE_URL,
    width: 1200,
    height: 630,
    alt: siteConfig.name,
  },
] as const

export const DEFAULT_TWITTER_IMAGES = [DEFAULT_OG_IMAGE_URL] as const

export function podcastMetadata(podcast: Podcast): Metadata {
  const description =
    podcast.subtitle ||
    podcast.summary ||
    stripHtml(podcast.description).slice(0, 200)
  const url = `${siteConfig.url}/podcasts/${podcast.id}/`
  // Build-time generated 1200x630 share-card. See @build/generate-og-images.ts.
  const ogImage = `${siteConfig.url}/og/podcasts/${podcast.id}.png`
  return {
    title: podcast.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: podcast.title,
      description,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: podcast.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: podcast.title,
      description,
      images: [ogImage],
    },
  }
}

export function episodeMetadata(
  podcast: Podcast,
  episode: Episode
): Metadata {
  const description = stripHtml(episode.description).slice(0, 200)
  const url = `${siteConfig.url}/podcasts/${podcast.id}/${episode.id}/`
  // Episode pages re-use the parent podcast's OG image. The episode title is
  // already conveyed via og:title; generating a unique image per episode
  // would balloon the static export by ~1MB × 1000s of episodes.
  const ogImage = `${siteConfig.url}/og/podcasts/${podcast.id}.png`
  return {
    title: `${episode.title} – ${podcast.title}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: episode.title,
      description,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: podcast.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: episode.title,
      description,
      images: [ogImage],
    },
  }
}

export function podcastJsonLd(podcast: Podcast) {
  const url = `${siteConfig.url}/podcasts/${podcast.id}/`
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: podcast.title,
    description: stripHtml(podcast.description).slice(0, 500),
    url,
    image: podcast.image,
    inLanguage: podcast.language,
    webFeed: podcast.rssUrl,
    author: podcast.authors.length
      ? podcast.authors.map((a) => ({
          "@type": "Person",
          name: a.name,
          url: a.websiteUrl ?? a.twitterUrl ?? a.linkedinUrl,
        }))
      : podcast.author
      ? { "@type": "Person", name: podcast.author }
      : undefined,
    genre: podcast.tags,
    aggregateRating: podcast.ratings.apple?.averageRating
      ? {
          "@type": "AggregateRating",
          ratingValue: podcast.ratings.apple.averageRating,
          ratingCount: podcast.ratings.apple.ratingCount ?? 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  }
}

export function episodeJsonLd(podcast: Podcast, episode: Episode) {
  const url = `${siteConfig.url}/podcasts/${podcast.id}/${episode.id}/`
  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: stripHtml(episode.description).slice(0, 500),
    url,
    image: episode.imageUrl || podcast.image,
    datePublished: episode.publishedAt,
    timeRequired: episode.duration ? `PT${episode.duration}S` : undefined,
    associatedMedia: episode.audioUrl || episode.videoUrl
      ? {
          "@type": episode.videoUrl ? "VideoObject" : "AudioObject",
          contentUrl: episode.videoUrl ?? episode.audioUrl,
        }
      : undefined,
    partOfSeries: {
      "@type": "PodcastSeries",
      name: podcast.title,
      url: `${siteConfig.url}/podcasts/${podcast.id}/`,
    },
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/podcasts/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

export function stripHtml(html: string): string {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}
