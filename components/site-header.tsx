import Link from "next/link"

import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { SearchTrigger } from "@/components/search/search-trigger"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchTrigger />
          <Link
            href="/submit/"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <Icons.add className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Add podcast</span>
            <span className="sm:hidden">Add</span>
          </Link>
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ size: "icon", variant: "ghost" })}
          >
            <Icons.gitHub className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
