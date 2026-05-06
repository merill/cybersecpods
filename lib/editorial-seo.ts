import type { Metadata } from "next"

import type { Podcast } from "@/types/podcast"
import { siteConfig } from "@/config/site"
import {
  CATEGORY_DESCRIPTIONS,
  categoryLabel,
  type CategorySlug,
} from "@/lib/categories"
import {
  bayesianRating,
  computeRatingPrior,
  getActivePodcasts,
  getPodcastsByCategory,
} from "@/lib/podcasts"
import { DEFAULT_OG_IMAGES } from "@/lib/seo"

export interface BestPodcastPage {
  slug: string
  title: string
  h1: string
  description: string
  intro: string
  audience: string
  categories?: readonly CategorySlug[]
  keywords: readonly string[]
}

export const BEST_PODCAST_PAGES = [
  {
    slug: "best-cybersecurity-podcasts",
    title: "Best Cybersecurity Podcasts",
    h1: "Best Cybersecurity Podcasts",
    description:
      "A curated ranking of the best cybersecurity podcasts, based on listener ratings, review volume, publishing activity, and topic coverage.",
    intro:
      "Use this guide as a fast way to find security shows worth adding to your queue. The ranking blends Apple Podcasts ratings, review counts, active publishing, and topic breadth so long-running favorites and strong specialist shows can both surface.",
    audience:
      "Best for security practitioners, CISOs, students, and curious technologists who want a high-signal starting point across the full cybersecurity landscape.",
    keywords: [
      "best cybersecurity podcasts",
      "best infosec podcasts",
      "cybersecurity podcast rankings",
    ],
  },
  {
    slug: "best-cloud-security-podcasts",
    title: "Best Cloud Security Podcasts",
    h1: "Best Cloud Security Podcasts",
    description:
      "The best cloud security podcasts covering cloud platforms, SaaS security, containers, identity, and modern infrastructure defense.",
    intro:
      "Cloud security changes quickly, and the most useful shows tend to mix platform depth with operational judgment. This list highlights active podcasts with strong listener signals and meaningful coverage of cloud, SaaS, container, and infrastructure security.",
    audience:
      "Best for cloud security engineers, platform teams, architects, and defenders responsible for securing modern infrastructure.",
    categories: ["cloud-security"],
    keywords: [
      "best cloud security podcasts",
      "cloud security podcasts",
      "SaaS security podcasts",
    ],
  },
  {
    slug: "best-identity-security-podcasts",
    title: "Best Identity Security Podcasts",
    h1: "Best Identity Security Podcasts",
    description:
      "A curated list of the best identity security podcasts for IAM, SSO, MFA, Entra ID, access governance, and zero trust.",
    intro:
      "Identity has become one of the main control planes for security programs. These podcasts are useful for following IAM, access governance, MFA, SSO, Entra ID, and zero-trust conversations without digging through general security feeds.",
    audience:
      "Best for identity architects, IAM engineers, Microsoft Entra teams, security leaders, and anyone working on access strategy.",
    categories: ["identity"],
    keywords: [
      "best identity security podcasts",
      "IAM podcasts",
      "zero trust podcasts",
    ],
  },
  {
    slug: "best-threat-intelligence-podcasts",
    title: "Best Threat Intelligence Podcasts",
    h1: "Best Threat Intelligence Podcasts",
    description:
      "Top threat intelligence podcasts for adversary tracking, incident context, IOCs, malware trends, and cyber threat reporting.",
    intro:
      "Threat intelligence podcasts are most valuable when they make active campaigns, attacker behavior, and security news easier to understand. This ranking favors active shows with strong listener trust and coverage that helps defenders connect events to action.",
    audience:
      "Best for threat intelligence analysts, SOC teams, incident responders, and security leaders who want concise context on the threat landscape.",
    categories: ["threat-intel"],
    keywords: [
      "best threat intelligence podcasts",
      "cyber threat podcasts",
      "threat intel podcasts",
    ],
  },
  {
    slug: "best-appsec-podcasts",
    title: "Best AppSec Podcasts",
    h1: "Best Application Security Podcasts",
    description:
      "The best application security podcasts covering AppSec, DevSecOps, API security, secure development, and software supply chain risk.",
    intro:
      "Application security shows are especially useful when they connect engineering practice to real risk. This list highlights podcasts that help developers, AppSec teams, and security engineers keep up with secure development, APIs, DevSecOps, and software supply chain topics.",
    audience:
      "Best for AppSec engineers, security champions, developers, DevSecOps teams, and product security leaders.",
    categories: ["appsec", "devsecops", "api-security"],
    keywords: [
      "best AppSec podcasts",
      "application security podcasts",
      "DevSecOps podcasts",
    ],
  },
  {
    slug: "best-ciso-podcasts",
    title: "Best CISO Podcasts",
    h1: "Best CISO and Security Leadership Podcasts",
    description:
      "Security leadership podcasts for CISOs and managers covering risk, strategy, governance, executive communication, and security programs.",
    intro:
      "CISO podcasts need to go beyond headlines. The strongest shows help leaders think through risk, program design, communication, hiring, governance, and the tradeoffs that come with running security at scale.",
    audience:
      "Best for CISOs, security managers, GRC leaders, founders, and practitioners preparing for leadership roles.",
    categories: ["leadership", "governance-risk-compliance", "career"],
    keywords: [
      "best CISO podcasts",
      "security leadership podcasts",
      "cybersecurity management podcasts",
    ],
  },
] as const satisfies readonly BestPodcastPage[]

export type BestPodcastPageSlug = (typeof BEST_PODCAST_PAGES)[number]["slug"]

export function getBestPodcastPage(slug: string): BestPodcastPage | undefined {
  return BEST_PODCAST_PAGES.find((page) => page.slug === slug)
}

export function getBestPodcastPageForCategory(
  slug: CategorySlug
): BestPodcastPage | undefined {
  return (BEST_PODCAST_PAGES as readonly BestPodcastPage[]).find((page) =>
    page.categories?.includes(slug)
  )
}

export function getRankedPodcastsForPage(
  page: BestPodcastPage,
  count = 20
): Podcast[] {
  const candidates = page.categories?.length
    ? uniquePodcasts(
        page.categories.flatMap((slug) => getPodcastsByCategory(slug))
      )
    : getActivePodcasts()
  return rankPodcasts(candidates).slice(0, count)
}

export function getRankedPodcastsForCategory(
  slug: CategorySlug,
  count = 12
): Podcast[] {
  return rankPodcasts(
    getPodcastsByCategory(slug).filter((p) => p.isActive)
  ).slice(0, count)
}

export function bestPodcastPageMetadata(page: BestPodcastPage): Metadata {
  const url = `${siteConfig.url}/${page.slug}/`
  return {
    title: page.title,
    description: page.description,
    keywords: [...page.keywords],
    alternates: { canonical: url },
    openGraph: {
      title: `${page.title} | ${siteConfig.name}`,
      description: page.description,
      type: "website",
      url,
      images: [...DEFAULT_OG_IMAGES],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | ${siteConfig.name}`,
      description: page.description,
      images: ["/og/default.png"],
    },
  }
}

export function categorySeoIntro(slug: CategorySlug): string {
  const label = categoryLabel(slug).toLowerCase()
  const description = CATEGORY_DESCRIPTIONS[slug]
  return `${description}. This category page helps you compare active ${label} podcasts by ratings, audience signals, publishing activity, and fit so you can quickly find shows worth following.`
}

function rankPodcasts(podcasts: Podcast[]): Podcast[] {
  const active = podcasts.filter((p) => p.isActive)
  const { m, C } = computeRatingPrior(active)
  return active
    .map((p) => {
      const ratingScore = bayesianRating(p, m, C)
      const reviewCount = p.ratings.apple?.ratingCount ?? 0
      const recency = p.lastEpisodeDate
        ? Math.max(
            0,
            1 - (Date.now() - Date.parse(p.lastEpisodeDate)) / 90 / 86_400_000
          )
        : 0
      const score =
        ratingScore * 20 +
        Math.log10(reviewCount + 1) * 8 +
        recency * 6 +
        Math.min(p.episodeCount, 200) / 200
      return { p, score }
    })
    .sort((a, b) => b.score - a.score)
    .map(({ p }) => p)
}

function uniquePodcasts(podcasts: Podcast[]): Podcast[] {
  const seen = new Set<string>()
  const out: Podcast[] = []
  for (const podcast of podcasts) {
    if (seen.has(podcast.id)) continue
    seen.add(podcast.id)
    out.push(podcast)
  }
  return out
}
