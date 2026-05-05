import { z } from "zod"
import {
  CADENCE_VALUES,
  CATEGORY_SLUGS,
  FORMAT_VALUES,
} from "../../lib/categories"

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), { message: "must be https://" })

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

// Build the Zod enum from the canonical 26 category slugs.
// `z.enum` requires a non-empty tuple of literals at the type level, so
// we cast through the constructed array.
const categoryEnum = z.enum(
  CATEGORY_SLUGS as unknown as [string, ...string[]]
)

const cadenceEnum = z.enum(
  CADENCE_VALUES as unknown as [string, ...string[]]
)

const formatEnum = z.enum(
  FORMAT_VALUES as unknown as [string, ...string[]]
)

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
      .array(categoryEnum)
      .min(1, "at least 1 category is required")
      .max(5, "no more than 5 categories")
      .refine(
        (arr) => new Set(arr).size === arr.length,
        "categories must be unique"
      ),
    cadence: cadenceEnum.optional(),
    format: formatEnum.optional(),
    authors: z
      .array(authorSchema)
      .max(10, "no more than 10 authors")
      .optional(),
    featured: z.boolean().optional(),
    submittedBy: z.string().optional(),
  })
  .strict()

export type PodcastInputParsed = z.infer<typeof podcastInputSchema>
