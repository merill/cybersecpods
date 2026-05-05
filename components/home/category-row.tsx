"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Podcast } from "@/types/podcast"
import { PodcastCard } from "@/components/podcast/podcast-card"

interface CategoryRowProps {
  title: string
  description?: string
  podcasts: Podcast[]
  href?: string
}

export function CategoryRow({
  title,
  description,
  podcasts,
  href,
}: CategoryRowProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = React.useState(false)
  const [canRight, setCanRight] = React.useState(true)

  const updateButtons = React.useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  React.useEffect(() => {
    updateButtons()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener("scroll", updateButtons, { passive: true })
    window.addEventListener("resize", updateButtons)
    return () => {
      el.removeEventListener("scroll", updateButtons)
      window.removeEventListener("resize", updateButtons)
    }
  }, [updateButtons])

  function scroll(dir: "left" | "right") {
    const el = scrollerRef.current
    if (!el) return
    const amount = el.clientWidth * 0.85
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" })
  }

  if (!podcasts.length) return null

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {href ? (
          <a
            href={href}
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            View all →
          </a>
        ) : null}
      </div>
      <div className="group relative">
        {canLeft ? (
          <Button
            variant="secondary"
            size="icon"
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : null}
        {canRight ? (
          <Button
            variant="secondary"
            size="icon"
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 rounded-full opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        ) : null}
        <div
          ref={scrollerRef}
          className={cn(
            "scrollbar-hidden flex gap-4 overflow-x-auto scroll-smooth pb-2",
            "snap-x snap-mandatory"
          )}
        >
          {podcasts.map((p) => (
            <div
              key={p.id}
              className="w-[150px] shrink-0 snap-start sm:w-[170px] md:w-[200px]"
            >
              <PodcastCard podcast={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
