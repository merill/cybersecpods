"use client"

import { useState } from "react"
import { LayoutGrid, Table } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PodcastCard } from "@/components/podcast-card"
import { PodcastTable } from "@/components/podcast-table"
import { Podcast } from "@/types/podcast"

interface PodcastViewProps {
  podcasts: Podcast[]
}

export function PodcastView({ podcasts }: PodcastViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          Cards
        </Button>
        <Button
          variant={viewMode === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("table")}
        >
          <Table className="mr-2 h-4 w-4" />
          Table
        </Button>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      ) : (
        <PodcastTable podcasts={podcasts} />
      )}
    </>
  )
}
