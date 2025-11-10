export interface Podcast {
  id: string
  title: string
  description: string
  link: string
  author: string
  lastBuildDate: string
  subtitle: string
  summary: string
  image: string
  category: string
  explicit: string
  rssUrl: string
  youtubeUrl: string | null
  applePodcastId: string | null
  tags: string[]
}

export interface PodcastConfig {
  rssUrl: string
  youTubeUrl?: string
  applePodcastId?: string
  tags?: string[]
}
