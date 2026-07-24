const API_BASE = ""

interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (res.status === 401) {
        const body = await res.json().catch(() => ({}))
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

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return { error: body.error || `HTTP ${res.status}` }
      }

      const body = await res.json()
      return { data: body as T }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { error: "Request timed out" }
      }
      return { error: err instanceof Error ? err.message : "Network error" }
    }
  }

  private async refresh(): Promise<boolean> {
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
}

export const api = new ApiClient(API_BASE)
