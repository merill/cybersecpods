import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import {
  getFeaturedPodcasts,
  getLatestEpisodes,
  getMostReviewedPodcasts,
  getPopularTags,
  getRecentlyUpdatedPodcasts,
  getTopRatedPodcasts,
  getTrendingPodcasts,
  getPodcastsByCategory,
} from "@/lib/podcasts"
import { categoryLabel, CATEGORY_DESCRIPTIONS, isCategorySlug, type CategorySlug } from "@/lib/categories"
import { DEFAULT_OG_IMAGES, websiteJsonLd } from "@/lib/seo"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { CategoryRow } from "@/components/home/category-row"
import { LatestEpisodesRail } from "@/components/home/latest-episodes-rail"

export const metadata: Metadata = {
  title: `${siteConfig.name} – ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url + "/" },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [...DEFAULT_OG_IMAGES],
  },
}

export default function HomePage() {
  const featured = getFeaturedPodcasts(3)
  const topRated = getTopRatedPodcasts(20)
  const mostReviewed = getMostReviewedPodcasts(20)
  const recentlyUpdated = getRecentlyUpdatedPodcasts(20)
  const trending = getTrendingPodcasts(20)
  // Up to 6 popular categories with at least 2 active podcasts.
  const popularCategories = getPopularTags(2)
    .map((t) => ({ tag: t.tag, count: t.count }))
    .filter((t): t is { tag: CategorySlug; count: number } =>
      isCategorySlug(t.tag)
    )
    .slice(0, 6)
  const latestEpisodes = getLatestEpisodes(46)

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
            {popularCategories.map(({ tag }) => {
              const items = getPodcastsByCategory(tag).filter((p) => p.isActive)
              if (items.length < 2) return null
              return (
                <CategoryRow
                  key={tag}
                  title={categoryLabel(tag)}
                  description={CATEGORY_DESCRIPTIONS[tag]}
                  podcasts={items}
                  href={`/categories/${tag}/`}
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
