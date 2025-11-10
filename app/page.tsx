import { PodcastView } from "@/components/podcast-view"
import { getAllPodcasts } from "@/lib/podcasts"

export default async function IndexPage() {
  const podcasts = await getAllPodcasts()

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold md:text-4xl">
          Cybersecurity Podcasts
        </h1>
        <p className="text-lg text-muted-foreground">
          Curated collection of cybersecurity podcasts covering identity, security, and technology.
        </p>
      </div>

      <PodcastView podcasts={podcasts} />
    </section>
  )
}
