"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RatingBadge } from "@/components/podcast/rating-badge"
import { stripHtml } from "@/lib/seo"
import type { Podcast } from "@/types/podcast"

interface HeroCarouselProps {
  podcasts: Podcast[]
}

export function HeroCarousel({ podcasts }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [Autoplay({ delay: 8000, stopOnInteraction: false, stopOnMouseEnter: true })]
  )
  const [selected, setSelected] = React.useState(0)

  React.useEffect(() => {
    if (!emblaApi) return
    const onSel = () => setSelected(emblaApi.selectedScrollSnap())
    onSel()
    emblaApi.on("select", onSel)
    emblaApi.on("reInit", onSel)
  }, [emblaApi])

  const scrollPrev = React.useCallback(
    () => emblaApi?.scrollPrev(),
    [emblaApi]
  )
  const scrollNext = React.useCallback(
    () => emblaApi?.scrollNext(),
    [emblaApi]
  )

  if (!podcasts.length) return null

  return (
    <section className="relative -mx-[max(0px,calc((100vw-100%)/2))] overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {podcasts.map((p) => (
            <HeroSlide key={p.id} podcast={p} />
          ))}
        </div>
      </div>
      {podcasts.length > 1 ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollPrev}
            aria-label="Previous featured podcast"
            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/40 backdrop-blur hover:bg-background/60 md:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollNext}
            aria-label="Next featured podcast"
            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/40 backdrop-blur hover:bg-background/60 md:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {podcasts.map((p, i) => (
              <button
                key={p.id}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full bg-white/40 transition-all",
                  i === selected ? "w-8 bg-white" : "w-1.5"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

function HeroSlide({ podcast }: { podcast: Podcast }) {
  const desc = stripHtml(
    podcast.subtitle || podcast.summary || podcast.description
  ).slice(0, 240)
  return (
    <div className="relative min-w-0 flex-[0_0_100%]">
      <div className="relative h-[60vh] min-h-[420px] max-h-[640px] w-full overflow-hidden">
        {podcast.image ? (
          <Image
            src={podcast.image}
            alt=""
            fill
            sizes="100vw"
            priority
            className="scale-110 object-cover blur-xl brightness-50"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-blue-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />
      </div>
      <div className="container absolute inset-0 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={podcast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="grid w-full gap-6 md:grid-cols-[300px_1fr] md:items-center md:gap-10"
          >
            {podcast.image ? (
              <div className="relative hidden aspect-square w-full max-w-[300px] overflow-hidden rounded-xl shadow-2xl md:block">
                <Image
                  src={podcast.image}
                  alt={podcast.title}
                  fill
                  sizes="300px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="max-w-2xl space-y-4">
              <Badge className="bg-primary/90 backdrop-blur" variant="default">
                Featured
              </Badge>
              <h1 className="text-3xl font-extrabold tracking-tight text-balance md:text-5xl lg:text-6xl">
                {podcast.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{podcast.author}</span>
                <RatingBadge ratings={podcast.ratings} />
                {podcast.episodeCount ? (
                  <span>{podcast.episodeCount} episodes</span>
                ) : null}
              </div>
              <p className="line-clamp-3 text-base text-muted-foreground md:text-lg">
                {desc}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href={`/podcasts/${podcast.id}/`}>
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Listen now
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href={`/podcasts/${podcast.id}/`}>
                    <Info className="mr-2 h-4 w-4" />
                    More info
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
