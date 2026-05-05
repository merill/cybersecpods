import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

const CACHE_DIR = path.join(process.cwd(), "@data", ".cache")

export interface CacheOptions {
  ttlMs?: number // time-to-live in ms; default 1 hour
}

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function keyToFile(namespace: string, key: string): string {
  const hash = crypto.createHash("sha1").update(key).digest("hex").slice(0, 16)
  return path.join(CACHE_DIR, `${namespace}-${hash}.json`)
}

export function getCached<T>(
  namespace: string,
  key: string,
  opts: CacheOptions = {}
): T | null {
  ensureDir()
  const file = keyToFile(namespace, key)
  if (!fs.existsSync(file)) return null
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as {
      ts: number
      v: T
    }
    const ttl = opts.ttlMs ?? 60 * 60 * 1000
    if (Date.now() - raw.ts > ttl) return null
    return raw.v
  } catch {
    return null
  }
}

export function setCached<T>(namespace: string, key: string, value: T): void {
  ensureDir()
  const file = keyToFile(namespace, key)
  fs.writeFileSync(file, JSON.stringify({ ts: Date.now(), v: value }))
}

export async function withCache<T>(
  namespace: string,
  key: string,
  fn: () => Promise<T>,
  opts: CacheOptions = {}
): Promise<T> {
  const hit = getCached<T>(namespace, key, opts)
  if (hit !== null) return hit
  const v = await fn()
  setCached(namespace, key, v)
  return v
}
