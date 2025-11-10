import Image from "next/image"
import Link from "next/link"
import { Podcast } from "@/types/podcast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PodcastCardProps {
  podcast: Podcast
}

export function PodcastCard({ podcast }: PodcastCardProps) {
  return (
    <Link href={`/podcast/${podcast.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg">
        <CardHeader className="p-0">
          {podcast.image && (
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={podcast.image}
                alt={podcast.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <CardTitle className="mb-2 line-clamp-2">{podcast.title}</CardTitle>
          <CardDescription className="mb-4 line-clamp-3">
            {podcast.subtitle || podcast.description}
          </CardDescription>
          {podcast.tags && podcast.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {podcast.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
