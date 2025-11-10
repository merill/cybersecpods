import Link from "next/link"
import { Podcast } from "@/types/podcast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PodcastTableProps {
  podcasts: Podcast[]
}

export function PodcastTable({ podcasts }: PodcastTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Podcast</TableHead>
            <TableHead className="hidden md:table-cell">Author</TableHead>
            <TableHead className="hidden lg:table-cell">Tags</TableHead>
            <TableHead className="hidden md:table-cell">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {podcasts.map((podcast) => (
            <TableRow key={podcast.id}>
              <TableCell className="w-full">
                <Link
                  href={`/podcast/${podcast.id}`}
                  className="hover:underline"
                >
                  <div className="font-medium">{podcast.title}</div>
                  {podcast.subtitle && (
                    <div className="text-sm text-muted-foreground">
                      {podcast.subtitle}
                    </div>
                  )}
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {podcast.author}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {podcast.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-nowrap">
                {podcast.lastBuildDate
                  ? new Date(podcast.lastBuildDate).toLocaleDateString()
                  : "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
