import fs from "fs"
import path from "path"
import { Podcast } from "@/types/podcast"

export async function getAllPodcasts(): Promise<Podcast[]> {
  const filePath = path.join(process.cwd(), "@data", "podcasts.json")
  const fileContents = fs.readFileSync(filePath, "utf8")
  const podcasts: Podcast[] = JSON.parse(fileContents)
  return podcasts
}

export async function getPodcastById(id: string): Promise<Podcast | null> {
  const podcasts = await getAllPodcasts()
  return podcasts.find((podcast) => podcast.id === id) || null
}

export async function getPodcastsByTag(tag: string): Promise<Podcast[]> {
  const podcasts = await getAllPodcasts()
  return podcasts.filter((podcast) =>
    podcast.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}

export async function getAllTags(): Promise<string[]> {
  const podcasts = await getAllPodcasts()
  const tags = new Set<string>()
  podcasts.forEach((podcast) => {
    podcast.tags.forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).sort()
}
