const API_BASE = ""

interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  // Sleep/wake resilience (2026-10): proxy marks cold-start failures
  // retryable so the UI can show "Trying again..." instead of raw errors.
  retryable?: boolean
  retryAfter?: number
}

class ApiClient {
  private baseUrl: string
  private refreshPromise: Promise<boolean> | null = null
  private getCache = new Map<string, { at: number; data: unknown }>()
  private static GET_TTL_MS = 45000

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async refresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise
    this.refreshPromise = this._refresh()
    const result = await this.refreshPromise
    this.refreshPromise = null
    return result
  }

  private async _refresh(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return res.ok
    } catch {
      return false
    }
  }

  private async fetchOnce(
    path: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        ...options,
        credentials: "include",
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private isRetriableStatus(status: number): boolean {
    return status === 502 || status === 503 || status === 504
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const method = options.method || "GET"
      // In-memory GET cache: repeat visits (back-nav, tab switches) resolve
      // instantly without another ~1.5s origin round trip. Any successful
      // mutation clears it so lists never show stale data.
      if (method === "GET") {
        const hit = this.getCache.get(path)
        if (hit && Date.now() - hit.at < ApiClient.GET_TTL_MS) {
          return { data: hit.data as T }
        }
      }
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      }
      // Transient Passenger/Vercel-proxy blips (502/503/504, timeouts) are
      // retried with backoff: GETs are idempotent (2 retries); mutations get
      // a single retry (a duplicate login only leaves an extra refresh-token
      // row, pruned by the 3-session cap).
      const maxAttempts = method === "GET" ? 3 : 2
      let res: Response | null = null
      let attempt = 0
      for (;;) {
        attempt += 1
        try {
          res = await this.fetchOnce(path, { ...options, headers }, 30000)
          if (!this.isRetriableStatus(res.status) || attempt >= maxAttempts) break
        } catch (err) {
          if (attempt >= maxAttempts) throw err
        }
        await new Promise((r) => setTimeout(r, 300 * attempt))
      }
      const finalRes = res as Response

      if (finalRes.status === 401) {
        const body = await finalRes.json().catch(() => ({}))
        const refreshed = await this.refresh()
        if (refreshed) {
          const retryRes = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...options.headers,
            },
          })
          if (!retryRes.ok) {
            const retryBody = await retryRes.json().catch(() => ({}))
            return { error: retryBody.error || "Request failed" }
          }
          const retryBody = await retryRes.json()
          return { data: retryBody as T }
        }
        return { error: body.error || "Session expired" }
      }

      if (!finalRes.ok) {
        const body = await finalRes.json().catch(() => ({}))
        if (this.isRetriableStatus(finalRes.status)) {
          return {
            error: body.error || "Service warming up — please try again in a few seconds.",
            retryable: true,
            retryAfter: body.retryAfter,
          }
        }
        if (finalRes.status === 429) {
          return {
            error: body.error || "Too many tries — please wait a few seconds and try again.",
            retryAfter: body.retryAfter,
          }
        }
        return { error: body.error || `HTTP ${finalRes.status}` }
      }

      const body = await finalRes.json()
      if (method === "GET") {
        this.getCache.set(path, { at: Date.now(), data: body })
        if (this.getCache.size > 200) {
          const oldest = this.getCache.keys().next().value
          if (oldest) this.getCache.delete(oldest)
        }
      } else {
        this.getCache.clear()
      }
      return { data: body as T }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { error: "Request timed out — trying again...", retryable: true }
      }
      return { error: err instanceof Error ? err.message : "Network error", retryable: true }
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "GET",
      headers: { "Cache-Control": "max-age=15, stale-while-revalidate=60" },
    })
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Cache-Control": "no-store" },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PATCH",
      headers: { "Cache-Control": "no-store" },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PUT",
      headers: { "Cache-Control": "no-store" },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "DELETE",
      headers: { "Cache-Control": "no-store" },
    })
  }

  /** Clear the in-memory GET cache (e.g. via list-header "Clear cache"). */
  clearGetCache(): void {
    this.getCache.clear()
  }

  /**
   * Milliseconds since `path` was cached, or null when not cached / expired.
   * TTL is unchanged (ApiClient.GET_TTL_MS). Omit `path` for the freshest
   * entry age across the whole cache.
   */
  getCacheAge(path?: string): number | null {
    if (path) {
      const hit = this.getCache.get(path)
      if (!hit || Date.now() - hit.at >= ApiClient.GET_TTL_MS) return null
      return Date.now() - hit.at
    }
    let freshest: number | null = null
    for (const entry of this.getCache.values()) {
      const age = Date.now() - entry.at
      if (age < ApiClient.GET_TTL_MS && (freshest === null || age < freshest)) {
        freshest = age
      }
    }
    return freshest
  }

  /**
   * Blob download for CSV/export endpoints (which return files, not JSON,
   * so they bypass request()/GET-cache). Forwards cookies so the admin
   * proxy authenticates the same as JSON calls.
   */
  async download(
    path: string
  ): Promise<{ blob?: Blob; filename?: string; error?: string }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      let res: Response
      try {
        res = await fetch(`${this.baseUrl}${path}`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeoutId)
      }
      if (res.status === 401) {
        const refreshed = await this.refresh()
        if (!refreshed) return { error: "Session expired" }
        res = await fetch(`${this.baseUrl}${path}`, {
          method: "GET",
          credentials: "include",
        })
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg =
          typeof body?.error === "string" ? body.error : `HTTP ${res.status}`
        return { error: msg }
      }
      const blob = await res.blob()
      const disposition = res.headers.get("content-disposition") || ""
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
      const filename = match?.[1] ? decodeURIComponent(match[1]) : undefined
      return { blob, filename }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { error: "Request timed out" }
      }
      return { error: err instanceof Error ? err.message : "Network error" }
    }
  }
}

export const api = new ApiClient(API_BASE)

/** Clear the shared in-memory GET cache without touching its TTL. */
export function clearApiCache(): void {
  api.clearGetCache()
}

/** Age (ms) of a cached GET entry, or null when uncached/expired. */
export function getApiCacheAge(path?: string): number | null {
  return api.getCacheAge(path)
}