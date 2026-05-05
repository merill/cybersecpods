// Spotify ratings are not displayed on the site (per design decision).
// This module is left as a stub for future use, e.g. if Spotify exposes
// public ratings through an official API. We still pass through the user-supplied
// spotifyUrl so we can deep-link from the podcast page.

export function normalizeSpotifyUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (!u.hostname.endsWith("spotify.com")) return null
    return u.origin + u.pathname
  } catch {
    return null
  }
}
