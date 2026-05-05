import type { Metadata } from "next"
import type { Podcast, Episode } from "@/types/podcast"
import { siteConfig } from "@/config/site"

export function podcastMetadata(podcast: Podcast): Metadata {
  const description =
    podcast.subtitle ||
    podcast.summary ||
    stripHtml(podcast.description).slice(0, 200)
  const url = `${siteConfig.url}/podcasts/${podcast.id}/`
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
      images: podcast.image ? [{ url: podcast.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: podcast.title,
      description,
      images: podcast.image ? [podcast.image] : undefined,
    },
  }
}

export function episodeMetadata(
  podcast: Podcast,
  episode: Episode
): Metadata {
  const description = stripHtml(episode.description).slice(0, 200)
  const url = `${siteConfig.url}/podcasts/${podcast.id}/${episode.id}/`
  const image = episode.imageUrl || podcast.image
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
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: episode.title,
      description,
      images: image ? [image] : undefined,
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
