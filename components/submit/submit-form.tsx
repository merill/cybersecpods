"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"

import type { PodcastInput } from "@/types/podcast"
import { podcastInputSchema } from "@/lib/podcast-schema"
import {
  type AppleLookupResult,
  type AuthorFormState,
  type PodcastFormState,
  buildPodcastInputJson,
  clientSlugify,
  emptyAuthor,
  emptyFormState,
  fromPodcastInput,
  lookupApple,
} from "@/lib/submit"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"

interface SubmitFormProps {
  /** Existing slugs (for duplicate / edit detection). */
  existingSlugs: string[]
  /** Existing tags (for autocomplete suggestions). */
  knownTags: string[]
  /** Repo info for issue URL. */
  repo: { owner: string; name: string }
}

type Mode = "add" | "edit"

const STEPS = [
  { id: "apple", label: "Apple ID" },
  { id: "details", label: "Details" },
  { id: "review", label: "Review & submit" },
] as const

type StepId = (typeof STEPS)[number]["id"]

export function SubmitForm({
  existingSlugs,
  knownTags,
  repo,
}: SubmitFormProps) {
  const router = useRouter()
  const params = useSearchParams()
  const editSlug = params.get("slug")
  const mode: Mode = editSlug ? "edit" : "add"

  const [state, setState] = useState<PodcastFormState>(emptyFormState())
  const [step, setStep] = useState<StepId>("apple")
  const [appleResult, setAppleResult] = useState<AppleLookupResult | null>(null)
  const [appleLoading, setAppleLoading] = useState(false)
  const [appleError, setAppleError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadingPrefill, setLoadingPrefill] = useState(mode === "edit")

  const lookupAbortRef = useRef<AbortController | null>(null)

  // Prefill from existing JSON when editing
  useEffect(() => {
    if (mode !== "edit" || !editSlug) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/podcasts-input/${editSlug}.json`, {
          cache: "no-store",
        })
        if (!res.ok) {
          throw new Error(
            `Couldn't load existing podcast (HTTP ${res.status}). The slug may be wrong.`
          )
        }
        const input = (await res.json()) as PodcastInput
        if (cancelled) return
        setState(fromPodcastInput(editSlug, input))
        // Validate the Apple ID immediately so we land on step 2
        try {
          const apple = await lookupApple(input.applePodcastId)
          if (!cancelled && apple) {
            setAppleResult(apple)
            setStep("details")
          }
        } catch {
          /* ignore — user can re-verify */
        }
      } catch (e) {
        if (!cancelled) setSubmitError((e as Error).message)
      } finally {
        if (!cancelled) setLoadingPrefill(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode, editSlug])

  const update = useCallback(
    <K extends keyof PodcastFormState>(key: K, value: PodcastFormState[K]) => {
      setState((s) => ({ ...s, [key]: value }))
    },
    []
  )

  const verifyApple = useCallback(async () => {
    setAppleError(null)
    setAppleResult(null)
    if (!/^\d{6,12}$/.test(state.applePodcastId.trim())) {
      setAppleError("Apple ID must be 6-12 digits (no 'id' prefix).")
      return
    }
    if (lookupAbortRef.current) lookupAbortRef.current.abort()
    const ctrl = new AbortController()
    lookupAbortRef.current = ctrl
    setAppleLoading(true)
    try {
      const result = await lookupApple(state.applePodcastId, ctrl.signal)
      if (!result) {
        setAppleError(
          "No podcast found for that Apple ID. Double-check the digits in your Apple Podcasts URL."
        )
        return
      }
      setAppleResult(result)
      // Auto-suggest a slug if none yet
      if (!state.slug) {
        const slug = clientSlugify(result.collectionName)
        if (slug) update("slug", slug)
      }
      // Duplicate-add detection
      if (mode === "add") {
        const dupe = existingSlugs.find((s) => {
          // Same slug?
          return s === clientSlugify(result.collectionName)
        })
        if (dupe) {
          setAppleError(
            `Heads up: a podcast with the slug "${dupe}" already exists in the directory. If this is the same show, please use the Edit flow on that podcast's page instead.`
          )
        }
      }
      setStep("details")
    } catch (e) {
      if ((e as DOMException).name !== "AbortError") {
        setAppleError((e as Error).message)
      }
    } finally {
      setAppleLoading(false)
    }
  }, [state.applePodcastId, state.slug, existingSlugs, mode, update])

  const validation = useMemo(() => {
    const json = buildPodcastInputJson(state)
    const result = podcastInputSchema.safeParse(json)
    return { json, result }
  }, [state])

  const slugError = useMemo(() => {
    if (!state.slug) return "Slug is required."
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(state.slug)) {
      return "Slug must be kebab-case (lowercase letters/numbers, single hyphens)."
    }
    if (mode === "add" && existingSlugs.includes(state.slug)) {
      return `Slug "${state.slug}" is already taken — pick a different one.`
    }
    if (mode === "edit" && state.slug !== editSlug) {
      return `Slug cannot be changed when editing. Reset to "${editSlug}".`
    }
    return null
  }, [state.slug, mode, existingSlugs, editSlug])

  const goReview = () => {
    setSubmitError(null)
    if (slugError) {
      setSubmitError(slugError)
      return
    }
    if (!validation.result.success) {
      const first = validation.result.error.issues[0]
      setSubmitError(
        `\`${first.path.join(".") || "(root)"}\`: ${first.message}`
      )
      return
    }
    setStep("review")
  }

  const issueUrl = useMemo(() => {
    if (!validation.result.success || slugError) return null
    const json = JSON.stringify(validation.json, null, 2)
    const template =
      mode === "edit"
        ? "cybersecpods-edit.yml"
        : "cybersecpods-submission.yml"
    const sp = new URLSearchParams()
    sp.set("template", template)
    sp.set("title", mode === "edit" ? `Edit: ${state.slug}` : `Add: ${state.slug}`)
    sp.set("labels", mode === "edit" ? "cybersecpods-edit" : "cybersecpods-submission")
    sp.set("slug", state.slug)
    sp.set("json", json)
    return `https://github.com/${repo.owner}/${repo.name}/issues/new?${sp.toString()}`
  }, [validation, slugError, mode, state.slug, repo])

  if (loadingPrefill) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Loading existing podcast data…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {mode === "edit" ? `Edit ${state.slug}` : "Submit a podcast"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "edit"
            ? "Update an existing entry in the directory. Your changes go through GitHub for review."
            : "Add a cybersecurity podcast to the directory. We'll guide you through it — no GitHub knowledge required, but a free GitHub account is needed to submit."}
        </p>
      </div>

      <ol className="mb-8 grid grid-cols-3 gap-2 text-xs">
        {STEPS.map((s, i) => {
          const stepIdx = STEPS.findIndex((x) => x.id === step)
          const isActive = s.id === step
          const isDone = i < stepIdx
          return (
            <li
              key={s.id}
              className={
                "flex items-center gap-2 rounded-md border px-3 py-2 " +
                (isActive
                  ? "border-primary bg-primary/5"
                  : isDone
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border opacity-60")
              }
            >
              <span
                className={
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold " +
                  (isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground")
                }
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span className="font-medium">{s.label}</span>
            </li>
          )
        })}
      </ol>

      {submitError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Couldn&apos;t continue</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      {step === "apple" ? (
        <StepApple
          applePodcastId={state.applePodcastId}
          onChange={(v) => update("applePodcastId", v)}
          onVerify={verifyApple}
          loading={appleLoading}
          error={appleError}
          result={appleResult}
        />
      ) : null}

      {step === "details" ? (
        <StepDetails
          state={state}
          mode={mode}
          editSlug={editSlug}
          slugError={slugError}
          appleResult={appleResult}
          knownTags={knownTags}
          onChange={update}
          onAddTag={(tag) =>
            setState((s) => ({
              ...s,
              tags: s.tags.includes(tag) ? s.tags : [...s.tags, tag],
            }))
          }
          onRemoveTag={(tag) =>
            setState((s) => ({ ...s, tags: s.tags.filter((t) => t !== tag) }))
          }
          onAddAuthor={() =>
            setState((s) => ({ ...s, authors: [...s.authors, emptyAuthor()] }))
          }
          onRemoveAuthor={(idx) =>
            setState((s) => ({
              ...s,
              authors: s.authors.filter((_, i) => i !== idx),
            }))
          }
          onChangeAuthor={(idx, key, value) =>
            setState((s) => ({
              ...s,
              authors: s.authors.map((a, i) =>
                i === idx ? { ...a, [key]: value } : a
              ),
            }))
          }
          validationIssues={
            !validation.result.success
              ? validation.result.error.issues.map((i) => ({
                  path: i.path.join("."),
                  message: i.message,
                }))
              : []
          }
          onBack={() => setStep("apple")}
          onNext={goReview}
        />
      ) : null}

      {step === "review" ? (
        <StepReview
          slug={state.slug}
          json={validation.json}
          mode={mode}
          issueUrl={issueUrl}
          onBack={() => setStep("details")}
          onCancel={() => router.push("/")}
        />
      ) : null}
    </div>
  )
}

/* ─────────────────────────  STEP 1  ───────────────────────── */

function StepApple({
  applePodcastId,
  onChange,
  onVerify,
  loading,
  error,
  result,
}: {
  applePodcastId: string
  onChange: (v: string) => void
  onVerify: () => void
  loading: boolean
  error: string | null
  result: AppleLookupResult | null
}) {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Apple Podcasts ID</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The only thing we need to start. Find your show on{" "}
          <a
            href="https://podcasts.apple.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            podcasts.apple.com
          </a>{" "}
          and grab the digits from the URL — e.g. for{" "}
          <code className="rounded bg-muted px-1 text-[12px]">
            podcasts.apple.com/us/podcast/darknet-diaries/<b>id1296350485</b>
          </code>{" "}
          enter <b>1296350485</b>.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="applePodcastId">Apple Podcasts ID *</Label>
        <Input
          id="applePodcastId"
          value={applePodcastId}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          placeholder="1296350485"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={12}
        />
        <p className="text-xs text-muted-foreground">
          Digits only, no <code>id</code> prefix.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <Alert variant="success">
          <AlertTitle>Found it</AlertTitle>
          <AlertDescription>
            <div className="mt-2 flex items-center gap-3">
              {result.artworkUrl600 ? (
                <Image
                  src={result.artworkUrl600}
                  alt=""
                  width={56}
                  height={56}
                  className="rounded-md border"
                  unoptimized
                />
              ) : null}
              <div className="min-w-0">
                <p className="font-semibold">{result.collectionName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {result.artistName}
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button
          onClick={onVerify}
          disabled={loading || !applePodcastId}
          size="lg"
        >
          {loading ? "Verifying…" : result ? "Continue →" : "Verify & continue"}
        </Button>
      </div>
    </div>
  )
}

/* ─────────────────────────  STEP 2  ───────────────────────── */

function StepDetails({
  state,
  mode,
  editSlug,
  slugError,
  appleResult,
  knownTags,
  onChange,
  onAddTag,
  onRemoveTag,
  onAddAuthor,
  onRemoveAuthor,
  onChangeAuthor,
  validationIssues,
  onBack,
  onNext,
}: {
  state: PodcastFormState
  mode: Mode
  editSlug: string | null
  slugError: string | null
  appleResult: AppleLookupResult | null
  knownTags: string[]
  onChange: <K extends keyof PodcastFormState>(
    key: K,
    value: PodcastFormState[K]
  ) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  onAddAuthor: () => void
  onRemoveAuthor: (idx: number) => void
  onChangeAuthor: (
    idx: number,
    key: keyof AuthorFormState,
    value: string
  ) => void
  validationIssues: { path: string; message: string }[]
  onBack: () => void
  onNext: () => void
}) {
  const [tagInput, setTagInput] = useState("")

  const filteredSuggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase()
    if (!q) return [] as string[]
    return knownTags
      .filter((t) => t.includes(q) && !state.tags.includes(t))
      .slice(0, 6)
  }, [knownTags, tagInput, state.tags])

  const addTagFromInput = () => {
    const cleaned = clientSlugify(tagInput)
    if (!cleaned) return
    onAddTag(cleaned)
    setTagInput("")
  }

  const issueFor = (path: string) =>
    validationIssues.find((i) => i.path === path || i.path.startsWith(path + "."))

  return (
    <div className="space-y-6">
      {/* Slug */}
      <Section title="Slug" desc="Becomes the URL: cybersecpods.com/podcasts/<slug>/">
        <Input
          value={state.slug}
          onChange={(e) =>
            onChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
          }
          placeholder="darknet-diaries"
          disabled={mode === "edit"}
        />
        {mode === "edit" && editSlug ? (
          <p className="text-xs text-muted-foreground">
            Slug is locked when editing.
          </p>
        ) : null}
        {slugError ? <FieldError>{slugError}</FieldError> : null}
      </Section>

      {/* Apple */}
      <Section
        title="Apple Podcasts ID"
        desc={appleResult ? `${appleResult.collectionName} · ${appleResult.artistName}` : ""}
      >
        <Input
          value={state.applePodcastId}
          onChange={(e) =>
            onChange("applePodcastId", e.target.value.replace(/\D/g, ""))
          }
          maxLength={12}
        />
      </Section>

      {/* Tags */}
      <Section
        title="Tags"
        desc="Free-form, kebab-case (e.g. threat-intelligence). Up to 12."
      >
        <div className="flex flex-wrap gap-1.5">
          {state.tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onRemoveTag(t)}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              {t}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag and press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                addTagFromInput()
              }
            }}
          />
          {filteredSuggestions.length ? (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
              {filteredSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onAddTag(s)
                    setTagInput("")
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {issueFor("tags") ? (
          <FieldError>{issueFor("tags")!.message}</FieldError>
        ) : null}
      </Section>

      {/* Socials */}
      <Section title="Links (all optional)" desc="">
        <div className="grid gap-3 sm:grid-cols-2">
          <UrlField
            label="Spotify URL"
            value={state.spotifyUrl}
            onChange={(v) => onChange("spotifyUrl", v)}
            placeholder="https://open.spotify.com/show/…"
            error={issueFor("spotifyUrl")?.message}
          />
          <UrlField
            label="YouTube URL"
            value={state.youtubeUrl}
            onChange={(v) => onChange("youtubeUrl", v)}
            placeholder="https://youtube.com/@channel"
            error={issueFor("youtubeUrl")?.message}
          />
          <UrlField
            label="Website URL"
            value={state.websiteUrl}
            onChange={(v) => onChange("websiteUrl", v)}
            placeholder="https://example.com"
            error={issueFor("websiteUrl")?.message}
          />
          <UrlField
            label="RSS feed URL"
            value={state.rssUrl}
            onChange={(v) => onChange("rssUrl", v)}
            placeholder="https://feeds.example.com/podcast.rss"
            help="Override the auto-detected RSS feed (rare)."
            error={issueFor("rssUrl")?.message}
          />
          <UrlField
            label="X / Twitter URL"
            value={state.twitterUrl}
            onChange={(v) => onChange("twitterUrl", v)}
            placeholder="https://x.com/podcast"
            error={issueFor("twitterUrl")?.message}
          />
          <UrlField
            label="LinkedIn URL"
            value={state.linkedinUrl}
            onChange={(v) => onChange("linkedinUrl", v)}
            placeholder="https://linkedin.com/company/podcast"
            error={issueFor("linkedinUrl")?.message}
          />
        </div>
      </Section>

      {/* Authors / Hosts */}
      <Section
        title="Hosts / Authors (optional)"
        desc="Add hosts with their own X / LinkedIn / website."
      >
        <div className="space-y-3">
          {state.authors.map((a, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Host #{i + 1}
                </p>
                <button
                  type="button"
                  onClick={() => onRemoveAuthor(i)}
                  className="text-xs font-medium text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Input
                  value={a.name}
                  onChange={(e) => onChangeAuthor(i, "name", e.target.value)}
                  placeholder="Name *"
                />
                <Input
                  value={a.websiteUrl}
                  onChange={(e) =>
                    onChangeAuthor(i, "websiteUrl", e.target.value)
                  }
                  placeholder="https://website.com"
                />
                <Input
                  value={a.twitterUrl}
                  onChange={(e) =>
                    onChangeAuthor(i, "twitterUrl", e.target.value)
                  }
                  placeholder="https://x.com/handle"
                />
                <Input
                  value={a.linkedinUrl}
                  onChange={(e) =>
                    onChangeAuthor(i, "linkedinUrl", e.target.value)
                  }
                  placeholder="https://linkedin.com/in/handle"
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={onAddAuthor}>
            + Add a host
          </Button>
        </div>
        {issueFor("authors") ? (
          <FieldError>{issueFor("authors")!.message}</FieldError>
        ) : null}
      </Section>

      {/* Submitted by */}
      <Section
        title="Your GitHub handle (optional)"
        desc="For credit on the PR."
      >
        <Input
          value={state.submittedBy}
          onChange={(e) => onChange("submittedBy", e.target.value)}
          placeholder="merill"
        />
      </Section>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} size="lg">
          Next: review →
        </Button>
      </div>
    </div>
  )
}

/* ─────────────────────────  STEP 3  ───────────────────────── */

function StepReview({
  slug,
  json,
  mode,
  issueUrl,
  onBack,
  onCancel,
}: {
  slug: string
  json: PodcastInput
  mode: Mode
  issueUrl: string | null
  onBack: () => void
  onCancel: () => void
}) {
  const filename = `@data/podcasts/${slug}.json`
  const pretty = JSON.stringify(json, null, 2)

  return (
    <div className="space-y-6">
      <Alert variant="info">
        <AlertTitle>Almost done</AlertTitle>
        <AlertDescription className="mt-1">
          When you click <b>Open GitHub issue</b>, you&apos;ll be taken to a
          pre-filled GitHub issue. <b>Don&apos;t change anything</b> — just
          click <b>Submit new issue</b> on GitHub. A bot will then automatically
          open a pull request with your{" "}
          {mode === "edit" ? "changes" : "new podcast"}, and a maintainer will
          review &amp; merge it. You&apos;ll need a (free) GitHub account.
        </AlertDescription>
      </Alert>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-2 text-xs">
          <code className="font-mono">{filename}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(pretty).catch(() => undefined)
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Copy JSON
          </button>
        </div>
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
          <code>{pretty}</code>
        </pre>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        {issueUrl ? (
          <a
            href={issueUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Icons.gitHub className="h-4 w-4" />
            Open GitHub issue →
          </a>
        ) : (
          <Button disabled>Validation errors above</Button>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have a GitHub account?{" "}
        <a
          href="https://github.com/signup"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Sign up
        </a>{" "}
        — it&apos;s free and takes 30 seconds.
      </p>
    </div>
  )
}

/* ─────────────────────────  helpers  ───────────────────────── */

function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2 rounded-xl border bg-card p-5">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {desc ? (
          <p className="text-xs text-muted-foreground">{desc}</p>
        ) : null}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function UrlField({
  label,
  value,
  onChange,
  placeholder,
  help,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  help?: string
  error?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder={placeholder}
        type="url"
        autoComplete="off"
      />
      {help ? <p className="text-[11px] text-muted-foreground">{help}</p> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-destructive">{children}</p>
}
