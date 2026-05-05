"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { buttonVariants } from "@/components/ui/button"
import type { Podcast } from "@/types/podcast"

interface SearchTriggerProps {
  podcasts?: Podcast[]
}

export function SearchTrigger({ podcasts }: SearchTriggerProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [data, setData] = React.useState<Podcast[]>(podcasts ?? [])
  const router = useRouter()

  React.useEffect(() => {
    if (data.length || !open) return
    fetch("/podcasts-index.json")
      .then((r) => r.json())
      .then((d) => setData(d as Podcast[]))
      .catch(() => undefined)
  }, [open, data.length])

  React.useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const filtered = React.useMemo(() => {
    if (!query.trim()) return data.slice(0, 12)
    const q = query.toLowerCase()
    return data
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      )
      .slice(0, 20)
  }, [data, query])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-full max-w-[220px] justify-between gap-2 px-2.5 text-xs font-normal text-muted-foreground"
        )}
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search podcasts...</span>
          <span className="sm:hidden">Search</span>
        </span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium md:inline-block">
          ⌘K
        </kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Search podcasts</DialogTitle>
          <Command shouldFilter={false} className="flex h-full w-full flex-col">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search by title, author, tag..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-96 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No podcasts found.
                </div>
              ) : (
                filtered.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      router.push(`/podcasts/${p.id}/`)
                      setOpen(false)
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                  >
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted" />
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {p.author}
                      </span>
                    </div>
                  </Command.Item>
                ))
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
