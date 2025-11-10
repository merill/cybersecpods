import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllPodcasts, getPodcastById } from "@/lib/podcasts"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PodcastPageProps {
  params: {
    id: string
  }
}

export async function generateStaticParams() {
  const podcasts = await getAllPodcasts()
  return podcasts.map((podcast) => ({
    id: podcast.id,
  }))
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const podcast = await getPodcastById(params.id)

  if (!podcast) {
    notFound()
  }

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex flex-col gap-6">
        {/* Header with image and basic info */}
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {podcast.image && (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={podcast.image}
                alt={podcast.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-extrabold md:text-4xl">
                {podcast.title}
              </h1>
              <p className="text-lg text-muted-foreground">{podcast.author}</p>
            </div>

            {/* Tags */}
            {podcast.tags && podcast.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {podcast.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={podcast.link} target="_blank" rel="noopener noreferrer">
                  <Icons.rss className="mr-2 h-4 w-4" />
                  View Podcast
                </Link>
              </Button>
              {podcast.youtubeUrl && (
                <Button variant="outline" asChild>
                  <Link href={podcast.youtubeUrl} target="_blank" rel="noopener noreferrer">
                    <Icons.youtube className="mr-2 h-4 w-4" />
                    YouTube
                  </Link>
                </Button>
              )}
              {podcast.applePodcastId && (
                <Button variant="outline" asChild>
                  <Link
                    href={`https://podcasts.apple.com/podcast/id${podcast.applePodcastId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icons.applePodcasts className="mr-2 h-4 w-4" />
                    Apple Podcasts
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: podcast.description || podcast.summary || "",
              }}
            />
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {podcast.subtitle && (
              <div>
                <h3 className="mb-1 font-semibold">Subtitle</h3>
                <p className="text-sm text-muted-foreground">
                  {podcast.subtitle}
                </p>
              </div>
            )}
            <div className="h-px w-full bg-border" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <h3 className="mb-1 font-semibold">Author</h3>
                <p className="text-sm text-muted-foreground">{podcast.author}</p>
              </div>
              {podcast.lastBuildDate && (
                <div>
                  <h3 className="mb-1 font-semibold">Last Updated</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(podcast.lastBuildDate).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}
              {podcast.category && (
                <div>
                  <h3 className="mb-1 font-semibold">Category</h3>
                  <p className="text-sm text-muted-foreground">
                    {podcast.category}
                  </p>
                </div>
              )}
              {podcast.explicit && (
                <div>
                  <h3 className="mb-1 font-semibold">Explicit Content</h3>
                  <p className="text-sm text-muted-foreground">
                    {podcast.explicit}
                  </p>
                </div>
              )}
            </div>
            <div className="h-px w-full bg-border" />
            <div>
              <h3 className="mb-2 font-semibold">RSS Feed</h3>
              <Link
                href={podcast.rssUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {podcast.rssUrl}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
