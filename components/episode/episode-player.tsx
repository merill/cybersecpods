"use client"

import { useEffect } from "react"

import type { Episode } from "@/types/podcast"

interface EpisodePlayerProps {
  episode: Episode
  poster?: string | null
}

export function EpisodePlayer({ episode, poster }: EpisodePlayerProps) {
  useEffect(() => {
    // Lazy-register media-chrome custom elements on the client.
    void import("media-chrome")
  }, [])

  if (!episode.audioUrl && !episode.videoUrl) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No playable media for this episode. Check the podcast's website or
        Apple Podcasts.
      </div>
    )
  }

  const isVideo = !!episode.videoUrl
  const src = (episode.videoUrl || episode.audioUrl) as string

  return (
    <div
      className={
        isVideo
          ? "overflow-hidden rounded-xl border bg-black"
          : "overflow-hidden rounded-xl border bg-card"
      }
    >
      {/* @ts-expect-error -- custom element */}
      <media-controller
        audio={isVideo ? undefined : true}
        style={{
          width: "100%",
          aspectRatio: isVideo ? "16 / 9" : undefined,
          display: "block",
        }}
      >
        {isVideo ? (
          <video
            slot="media"
            src={src}
            poster={poster ?? undefined}
            playsInline
            preload="metadata"
            crossOrigin="anonymous"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <audio
            slot="media"
            src={src}
            preload="metadata"
            crossOrigin="anonymous"
          />
        )}
        {/* @ts-expect-error -- custom element */}
        <media-control-bar>
          {/* @ts-expect-error */}
          <media-play-button />
          {/* @ts-expect-error */}
          <media-seek-backward-button seekoffset={15} />
          {/* @ts-expect-error */}
          <media-seek-forward-button seekoffset={30} />
          {/* @ts-expect-error */}
          <media-time-display showduration />
          {/* @ts-expect-error */}
          <media-time-range />
          {/* @ts-expect-error */}
          <media-playback-rate-button />
          {/* @ts-expect-error */}
          <media-mute-button />
          {/* @ts-expect-error */}
          <media-volume-range />
          {isVideo ? (
            // @ts-expect-error
            <media-fullscreen-button />
          ) : null}
        {/* @ts-expect-error */}
        </media-control-bar>
      {/* @ts-expect-error */}
      </media-controller>
    </div>
  )
}
