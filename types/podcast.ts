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
  tags?: string[]
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

  // taxonomy
  tags: string[]
  authors: Author[]

  // computed
  lastEpisodeDate: string | null
  episodeCount: number
  hasVideo: boolean
  isActive: boolean
  featured: boolean

  // ratings (Apple only)
  ratings: Ratings

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
