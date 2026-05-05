import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return ""
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

export function formatDate(input: string | Date | null): string {
  if (!input) return ""
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatRelative(input: string | Date | null): string {
  if (!input) return ""
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return ""
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const days = Math.floor(abs / (1000 * 60 * 60 * 24))
  if (days === 0) return "today"
  if (days === 1) return diff < 0 ? "yesterday" : "tomorrow"
  if (days < 30) return diff < 0 ? `${days} days ago` : `in ${days} days`
  const months = Math.floor(days / 30)
  if (months < 12) return diff < 0 ? `${months} mo ago` : `in ${months} mo`
  const years = Math.floor(days / 365)
  return diff < 0 ? `${years}y ago` : `in ${years}y`
}

export function formatRatingCount(n: number | null | undefined): string {
  if (n == null) return ""
  if (n < 1000) return String(n)
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  if (n < 1_000_000) return Math.round(n / 1000) + "K"
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
}

/**
 * Format a kebab-case tag for display. Special-cases known acronyms.
 */
export function displayTag(tag: string): string {
  const acronyms = new Set([
    "ai",
    "ot",
    "dfir",
    "iam",
    "ciso",
    "soc",
    "osint",
    "siem",
    "edr",
    "xdr",
    "iso",
  ])
  return tag
    .split("-")
    .map((part) =>
      acronyms.has(part)
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ")
}
