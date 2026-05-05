/**
 * Canonical taxonomy for CyberSecPods.
 *
 * Three orthogonal axes:
 *   - CATEGORIES: subject of the show (1\u20135 per podcast, enum-enforced)
 *   - CADENCE:    publishing frequency (single value, optional)
 *   - FORMAT:     show structure (single value, optional)
 *
 * Vendor (microsoft/cisco), region (europe/asia-pacific), and other
 * non-canonical labels are intentionally excluded. Format is not a tag.
 */

export const CATEGORY_GROUPS = [
  {
    slug: "defensive",
    label: "Defensive Operations",
    description: "Detection, response, and defender disciplines",
    categories: [
      "blue-team",
      "soc",
      "threat-intel",
      "incident-response",
      "vulnerability-management",
    ],
  },
  {
    slug: "offensive",
    label: "Offensive Operations",
    description: "Adversary emulation and offensive security",
    categories: ["red-team", "penetration-testing", "purple-team"],
  },
  {
    slug: "appsec",
    label: "Application Security",
    description: "Securing software, APIs, and the SDLC",
    categories: ["appsec", "devsecops", "api-security"],
  },
  {
    slug: "infrastructure",
    label: "Infrastructure & Platform",
    description: "Securing the underlying systems and networks",
    categories: [
      "cloud-security",
      "network-security",
      "ot-ics-security",
      "identity",
    ],
  },
  {
    slug: "specialty",
    label: "Specialty Domains",
    description: "Cross-cutting and specialised security topics",
    categories: ["privacy", "governance-risk-compliance", "ai-security"],
  },
  {
    slug: "people",
    label: "People & Career",
    description: "Humans, leadership, and the security workforce",
    categories: ["leadership", "career", "awareness-training"],
  },
  {
    slug: "news",
    label: "News & Media",
    description: "Industry news, interviews, and storytelling",
    categories: ["news", "interviews", "storytelling"],
  },
  {
    slug: "emerging",
    label: "Emerging & Research",
    description: "Frontier research and emerging technology",
    categories: ["research", "emerging-tech"],
  },
] as const

export type CategoryGroup = (typeof CATEGORY_GROUPS)[number]
export type CategoryGroupSlug = CategoryGroup["slug"]

/** All 26 canonical category slugs, in display order. */
export const CATEGORY_SLUGS = CATEGORY_GROUPS.flatMap(
  (g) => g.categories
) as unknown as readonly CategoryGroup["categories"][number][]

export type CategorySlug = CategoryGroup["categories"][number]

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  "blue-team": "Blue Team",
  soc: "SOC",
  "threat-intel": "Threat Intelligence",
  "incident-response": "Incident Response",
  "vulnerability-management": "Vulnerability Management",
  "red-team": "Red Team",
  "penetration-testing": "Penetration Testing",
  "purple-team": "Purple Team",
  appsec: "Application Security",
  devsecops: "DevSecOps",
  "api-security": "API Security",
  "cloud-security": "Cloud Security",
  "network-security": "Network Security",
  "ot-ics-security": "OT / ICS Security",
  identity: "Identity & Access",
  privacy: "Privacy",
  "governance-risk-compliance": "Governance, Risk & Compliance",
  "ai-security": "AI Security",
  leadership: "Leadership",
  career: "Career",
  "awareness-training": "Awareness & Training",
  news: "News",
  interviews: "Interviews",
  storytelling: "Storytelling",
  research: "Research",
  "emerging-tech": "Emerging Tech",
}

export const CATEGORY_DESCRIPTIONS: Record<CategorySlug, string> = {
  "blue-team": "Defender-focused detection, hardening, and operations",
  soc: "Security operations centres, monitoring, and SIEM",
  "threat-intel": "Adversary tracking, IOCs, and threat reporting",
  "incident-response": "Breach response, forensics, and recovery",
  "vulnerability-management": "Discovery, triage, and remediation of vulns",
  "red-team": "Adversary emulation and red-team operations",
  "penetration-testing": "Hands-on pentesting and offensive tradecraft",
  "purple-team": "Collaborative offence-and-defence exercises",
  appsec: "Application security and secure development",
  devsecops: "Security in CI/CD and developer workflows",
  "api-security": "Securing APIs, web services, and microservices",
  "cloud-security": "Cloud platform, container, and SaaS security",
  "network-security": "Network defence, perimeter, and zero trust",
  "ot-ics-security": "OT, ICS, SCADA, and critical infrastructure",
  identity: "IAM, SSO, MFA, and access governance",
  privacy: "Data protection and privacy engineering",
  "governance-risk-compliance": "GRC, regulation, and audit",
  "ai-security": "Securing AI/ML systems and AI-assisted security",
  leadership: "CISOs, security leadership, and management",
  career: "Career paths, hiring, and professional growth",
  "awareness-training": "Security awareness and end-user training",
  news: "Weekly and daily cybersecurity news",
  interviews: "Long-form interviews with practitioners",
  storytelling: "Narrative, true-crime, and historical stories",
  research: "Academic and industry security research",
  "emerging-tech": "Quantum, post-quantum crypto, and other frontiers",
}

// ---------- Cadence ----------

export const CADENCE_VALUES = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "irregular",
] as const

export type Cadence = (typeof CADENCE_VALUES)[number]

export const CADENCE_LABELS: Record<Cadence, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  irregular: "Irregular",
}

// ---------- Format ----------

export const FORMAT_VALUES = [
  "interview",
  "narrative",
  "panel",
  "solo",
  "news-brief",
] as const

export type Format = (typeof FORMAT_VALUES)[number]

export const FORMAT_LABELS: Record<Format, string> = {
  interview: "Interview",
  narrative: "Narrative",
  panel: "Panel",
  solo: "Solo",
  "news-brief": "News Brief",
}

// ---------- Helpers ----------

const CATEGORY_SET = new Set<string>(CATEGORY_SLUGS)

export function isCategorySlug(s: string): s is CategorySlug {
  return CATEGORY_SET.has(s)
}

export function categoryLabel(slug: string): string {
  return isCategorySlug(slug) ? CATEGORY_LABELS[slug] : slug
}

/** Return the group a category belongs to, if any. */
export function groupForCategory(slug: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find((g) =>
    (g.categories as readonly string[]).includes(slug)
  )
}
