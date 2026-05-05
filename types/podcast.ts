import type { Cadence, CategorySlug, Format } from "@/lib/categories"

// Author for a podcast (multi-author support)
export interface Author {
  name: string
  twitterUrl?: string
  linkedinUrl?: string
  websiteUrl?: string
}

// User-supplied input file: @data/podcasts/<slug>.json
export interface PodcastInput {
  applePodcastId: string // required (digits only)
  spotifyUrl?: string
  websiteUrl?: string
  rssUrl?: string
  youtubeUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  // 1-5 canonical category slugs (see lib/categories.ts)
  tags?: CategorySlug[]
  cadence?: Cadence
  format?: Format
  authors?: Author[]
  featured?: boolean
  submittedBy?: string
}

// Apple ratings (only Apple shown on site)
export interface Ratings {
  apple?: {
    averageRating: number | null
    ratingCount: number | null
    fetchedAt: string
  }
}

// A single review fetched from Apple's customer-reviews RSS feed.
export interface PodcastReview {
  rating: number // 1-5
  title: string
  content: string
  author: string
  updatedAt: string // ISO
}

// Hydrated podcast (input + RSS-derived + computed)
export interface Podcast {
  // identity
  id: string // slug from filename
  applePodcastId: string

  // RSS-derived
  title: string
  description: string
  summary: string
  subtitle: string
  image: string
  author: string
  language: string
  // RSS / iTunes feed categories (free-form; distinct from `tags` taxonomy)
  categories: string[]
  explicit: boolean
  websiteUrl: string
  rssUrl: string
  copyright: string

  // social
  spotifyUrl: string | null
  youtubeUrl: string | null
  twitterUrl: string | null
  linkedinUrl: string | null
  applePodcastUrl: string

  // taxonomy (canonical)
  tags: CategorySlug[]
  cadence: Cadence | null
  format: Format | null
  authors: Author[]

  // computed
  lastEpisodeDate: string | null
  // ISO date of the oldest episode currently visible in the RSS feed.
  // Used as a proxy for show "age" when ranking trending podcasts. Note: some
  // RSS feeds truncate older episodes, so for long-running shows this may be
  // newer than the show's actual launch date.
  firstEpisodeDate: string | null
  episodeCount: number
  hasVideo: boolean
  isActive: boolean
  featured: boolean

  // ratings (Apple only)
  ratings: Ratings

  // up to 5 most-recent reviews from Apple Podcasts (optional; absent if
  // Apple has no reviews for this show)
  recentReviews?: PodcastReview[]

  // submission
  submittedBy?: string
}

export interface PodcastWithEpisodes extends Podcast {
  episodes: Episode[]
}

export interface Episode {
  id: string // slug
  podcastId: string
  title: string
  description: string
  publishedAt: string
  duration: number // seconds
  audioUrl: string | null
  videoUrl: string | null
  imageUrl: string | null
  episodeNumber: number | null
  seasonNumber: number | null
  explicit: boolean
  episodeType: string | null
  appleEpisodeId: string | null
  link: string | null
}
