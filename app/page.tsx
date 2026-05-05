import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import {
  getActivePodcasts,
  getFeaturedPodcasts,
  getLatestEpisodes,
  getMostReviewedPodcasts,
  getPopularTags,
  getRecentlyUpdatedPodcasts,
  getTopRatedPodcasts,
  getPodcastsByTag,
  shuffleSeeded,
} from "@/lib/podcasts"
import { displayTag } from "@/lib/utils"
import { websiteJsonLd } from "@/lib/seo"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { CategoryRow } from "@/components/home/category-row"
import { LatestEpisodesRail } from "@/components/home/latest-episodes-rail"

export const metadata: Metadata = {
  title: `${siteConfig.name} – Discover the best cybersecurity podcasts`,
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url + "/" },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
}

export default function HomePage() {
  const featured = getFeaturedPodcasts(3)
  const active = getActivePodcasts()
  const topRated = getTopRatedPodcasts(20)
  const mostReviewed = getMostReviewedPodcasts(20)
  const recentlyUpdated = getRecentlyUpdatedPodcasts(20)
  const trending = shuffleSeeded(active).slice(0, 20)
  const popularTags = getPopularTags(2).slice(0, 6)
  const latestEpisodes = getLatestEpisodes(60)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <HeroCarousel podcasts={featured} />
      <div className="container space-y-10 py-8 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10 min-w-0">
            <CategoryRow
              title="Trending"
              description="A fresh mix of active cybersecurity shows"
              podcasts={trending}
              href="/podcasts/"
            />
            <CategoryRow
              title="Top Rated"
              description="Highest-rated podcasts on Apple Podcasts"
              podcasts={topRated}
              href="/podcasts/?sort=rating"
            />
            <CategoryRow
              title="Most Reviewed"
              description="Podcasts with the largest listener communities"
              podcasts={mostReviewed}
              href="/podcasts/?sort=reviews"
            />
            <CategoryRow
              title="Recently Updated"
              description="Podcasts with new episodes in the last few weeks"
              podcasts={recentlyUpdated}
              href="/podcasts/?sort=updated"
            />
            {popularTags.map(({ tag }) => {
              const items = getPodcastsByTag(tag).filter((p) => p.isActive)
              if (items.length < 2) return null
              return (
                <CategoryRow
                  key={tag}
                  title={displayTag(tag)}
                  podcasts={items}
                  href={`/tags/${tag}/`}
                />
              )
            })}
          </div>
          <LatestEpisodesRail episodes={latestEpisodes} />
        </div>
      </div>
    </>
  )
}
