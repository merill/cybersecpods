// Client-safe Zod schemas mirroring @build/lib/zod-schemas.ts.
// Kept in sync manually — if you change one, change the other.

import { z } from "zod"

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), { message: "must be https://" })

const kebab = z
  .string()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "tags must be kebab-case (lowercase letters/numbers separated by single hyphens)"
  )
  .max(48, "tag is too long")

const hostMatch = (hosts: string[]) =>
  z.string().refine(
    (u) => {
      try {
        const url = new URL(u)
        return hosts.some(
          (h) => url.hostname === h || url.hostname.endsWith("." + h)
        )
      } catch {
        return false
      }
    },
    { message: `URL must be on one of: ${hosts.join(", ")}` }
  )

const twitterUrl = httpsUrl.and(hostMatch(["x.com", "twitter.com"]))
const linkedinUrl = httpsUrl.and(hostMatch(["linkedin.com"]))
const youtubeUrl = httpsUrl.and(hostMatch(["youtube.com", "youtu.be"]))
const spotifyUrl = httpsUrl.and(hostMatch(["spotify.com"]))

export const authorSchema = z
  .object({
    name: z.string().min(1, "author name is required"),
    twitterUrl: twitterUrl.optional(),
    linkedinUrl: linkedinUrl.optional(),
    websiteUrl: httpsUrl.optional(),
  })
  .strict()

export const podcastInputSchema = z
  .object({
    applePodcastId: z
      .string()
      .regex(
        /^\d{6,12}$/,
        "applePodcastId must be 6-12 digits (no 'id' prefix)"
      ),
    spotifyUrl: spotifyUrl.optional(),
    websiteUrl: httpsUrl.optional(),
    rssUrl: httpsUrl.optional(),
    youtubeUrl: youtubeUrl.optional(),
    twitterUrl: twitterUrl.optional(),
    linkedinUrl: linkedinUrl.optional(),
    tags: z
      .array(kebab)
      .max(12, "no more than 12 tags")
      .refine(
        (arr) => new Set(arr).size === arr.length,
        "tags must be unique"
      )
      .optional(),
    authors: z
      .array(authorSchema)
      .max(10, "no more than 10 authors")
      .optional(),
    featured: z.boolean().optional(),
    submittedBy: z.string().optional(),
  })
  .strict()

export type PodcastInputParsed = z.infer<typeof podcastInputSchema>

// Slug for filename / URL
export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "slug must be kebab-case (lowercase letters/numbers separated by single hyphens)"
  )
  .min(2, "slug too short")
  .max(64, "slug too long")
