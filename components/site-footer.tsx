import Link from "next/link"

import { siteConfig } from "@/config/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 md:h-20 md:flex-row md:py-0">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          A curated directory of cybersecurity podcasts. Built by{" "}
          <Link
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Merill
          </Link>
          .{" "}
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Contribute on GitHub
          </Link>
          .
        </p>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/about/" className="hover:text-foreground">
            About
          </Link>
          <Link href="/podcasts/" className="hover:text-foreground">
            Podcasts
          </Link>
          <Link href="/episodes/" className="hover:text-foreground">
            Episodes
          </Link>
          <Link href="/rss.xml" className="hover:text-foreground">
            RSS
          </Link>
        </nav>
      </div>
    </footer>
  )
}
