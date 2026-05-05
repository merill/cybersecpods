import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { getAllPodcasts, getAllTags, getLatestEpisodes } from "@/lib/podcasts"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export const metadata: Metadata = {
  title: "About",
  description:
    "Why CyberSecPods exists. A simple, open-source directory of cybersecurity podcasts that stays up to date. Built by a podcaster, for podcast listeners.",
  alternates: { canonical: siteConfig.url + "/about/" },
}

export default function AboutPage() {
  const podcasts = getAllPodcasts()
  const active = podcasts.filter((p) => p.isActive)
  const tags = getAllTags()
  const episodes = getLatestEpisodes(1, { includeInactive: true })
  const totalEpisodes = podcasts.reduce((sum, p) => sum + p.episodeCount, 0)
  const lastUpdated = episodes[0]?.publishedAt

  return (
    <div className="relative">
      {/* Soft hero background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary/10 via-background to-background"
      />

      <div className="container max-w-3xl py-12 md:py-20">
        {/* Hero */}
        <header className="text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Icons.logo className="h-3.5 w-3.5" />
            About CyberSecPods
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            The cybersecurity podcast directory{" "}
            <span className="text-muted-foreground">
              I wanted to exist.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
            An open-source list of cybersecurity podcasts that stays current,
            built with the help of the people who listen to them.
          </p>
        </header>

        {/* Stats */}
        <dl className="mt-12 grid grid-cols-2 gap-3 rounded-2xl border bg-card/50 p-3 md:grid-cols-4 md:gap-6 md:p-6">
          {[
            { label: "Active podcasts", value: active.length.toLocaleString() },
            {
              label: "Total tracked",
              value: podcasts.length.toLocaleString(),
            },
            {
              label: "Episodes indexed",
              value: totalEpisodes.toLocaleString(),
            },
            { label: "Topic tags", value: tags.length.toLocaleString() },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-background/60 p-4 md:bg-transparent md:p-0"
            >
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-1 text-2xl font-bold md:text-3xl">{s.value}</dd>
            </div>
          ))}
        </dl>

        {/* Story */}
        <section className="mt-16 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Why this exists
          </h2>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-[17px]">
            <p>
              I love cybersecurity podcasts. They&apos;re how I keep up with a
              field that moves faster than any blog or newsletter can. So I
              wanted a good way to <em>find</em> them.
            </p>
            <p>
              There isn&apos;t one. The Apple Podcasts and Spotify apps are
              fine for shows you already know, but the browse experience is
              awkward, the categories are too broad, and finding new shows
              feels like luck. The &ldquo;best cybersecurity podcasts&rdquo;
              listicles you find on Google are mostly years out of date, still
              recommending shows that quietly stopped publishing in 2021.
            </p>
            <p>
              I wanted one place that answered: <em>which cybersecurity
              podcasts are still going</em>, what are they about, and when did
              they last publish. So I built it.
            </p>
          </div>
        </section>

        {/* What makes it different */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            What makes this different
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            <li className="rounded-xl border bg-card/50 p-5">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icons.clock className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">Always fresh</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Every podcast&apos;s RSS feed is re-fetched every hour. Apple
                ratings refresh daily. If a show goes quiet for 60 days
                it&apos;s flagged as inactive, but its episodes stay
                searchable.
              </p>
            </li>
            <li className="rounded-xl border bg-card/50 p-5">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icons.search className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">Built for browsing</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Filter by topic, search across every episode title, and click
                straight through to Apple, Spotify, YouTube, or the show&apos;s
                own RSS feed. ⌘K opens search from anywhere.
              </p>
            </li>
            <li className="rounded-xl border bg-card/50 p-5">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icons.gitHub className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">Open and community-shaped</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The directory lives in a public GitHub repo. Anyone can add a
                show or suggest edits. The in-browser form does most of the
                work, and a bot validates the submission and opens the PR for
                you.
              </p>
            </li>
            <li className="rounded-xl border bg-card/50 p-5">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icons.globe className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">No tracking, no accounts</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The site is fully static. No cookies, no analytics on you, no
                login. Audio and video stream directly from each podcast&apos;s
                host. We never proxy or store media.
              </p>
            </li>
          </ul>
        </section>

        {/* Contribute CTA */}
        <section className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/10 via-card/60 to-card/30 p-6 md:p-10">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Know a great show? Add it.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            This site only works if the people who listen help shape it. If
            your favourite show is missing, the in-browser form takes about 30
            seconds. All you need is the Apple Podcasts ID. Everything else is
            auto-filled from the RSS feed.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/submit/"
              className={buttonVariants({ size: "lg" })}
            >
              <Icons.add className="mr-1.5 h-4 w-4" />
              Add a podcast
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              <Icons.gitHub className="mr-1.5 h-4 w-4" />
              View on GitHub
            </Link>
          </div>
        </section>

        {/* About the maker */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            About the maker
          </h2>
          <div className="mt-6 rounded-2xl border bg-card/50 p-6 md:p-8">
            <p className="text-base leading-relaxed text-muted-foreground md:text-[17px]">
              I&apos;m{" "}
              <Link
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Merill Fernando
              </Link>
              . I work in identity and cloud security, and I host my own
              podcast,{" "}
              <a
                href="https://entra.chat"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Entra.Chat
              </a>
              , a show about Microsoft Entra and modern identity.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-[17px]">
              Running my own podcast made me want a better way for
              cybersecurity shows to be discovered. Not just mine, but
              everyone&apos;s. CyberSecPods is that place: somewhere good
              shows are easy to find, great new ones don&apos;t get lost, and
              the community can keep the list current.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="https://entra.chat"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                <Icons.play className="h-3.5 w-3.5" />
                Entra.Chat
                <Icons.externalLink className="h-3 w-3 opacity-60" />
              </a>
              <a
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                <Icons.x className="h-3.5 w-3.5" />
                @merill
              </a>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                <Icons.gitHub className="h-3.5 w-3.5" />
                merill on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* How it works (terse, technical) */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Under the hood
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              CyberSecPods is a static site. The directory is a set of small
              JSON files in the GitHub repo, one per podcast, each pointing to
              an Apple Podcasts ID. A scheduled job pulls each show&apos;s RSS
              feed every hour to refresh episode metadata, and a daily job
              pulls the latest Apple ratings. Cloudflare Pages rebuilds and
              redeploys on every change.
            </p>
            <p>
              When you submit a podcast, the form turns your input into the
              same JSON that lives in the repo and pre-fills a GitHub Issue. A
              bot validates it, opens a pull request, and links the PR back on
              the issue. Once it&apos;s merged the show appears here within an
              hour.
            </p>
          </div>
        </section>

        {lastUpdated ? (
          <p className="mt-16 text-center text-xs text-muted-foreground">
            Last episode indexed {new Date(lastUpdated).toUTCString()}
          </p>
        ) : null}
      </div>
    </div>
  )
}
