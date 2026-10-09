import { NextRequest, NextResponse } from "next/server"

const API_BACKEND = process.env.API_BACKEND_URL || "https://api.allpropertylink.co.ke"

async function proxy(req: NextRequest, key: string) {
  const url = new URL(req.url)
  const target = `${API_BACKEND}/${key}${url.search}`

  const headers: Record<string, string> = {}
  const cookie = req.headers.get("cookie")
  if (cookie) headers["cookie"] = cookie
  const contentType = req.headers.get("content-type")
  if (contentType) headers["content-type"] = contentType
  const csrf = req.headers.get("x-csrf-token")
  if (csrf) headers["x-csrf-token"] = csrf
  const auth = req.headers.get("authorization")
  if (auth) headers["authorization"] = auth

  const method = req.method
  let body: BodyInit | undefined
  if (method !== "GET" && method !== "HEAD") {
    const buf = await req.arrayBuffer()
    if (buf.byteLength > 0) body = buf
  }

  // Same Passenger sleep/wake retry as the main site: two 4s attempts
  // (~8.3s total) inside the Vercel Hobby 10s function limit.
  let upstream: Response | null = null
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 4000)
    try {
      upstream = await fetch(target, {
        method,
        headers,
        body,
        cache: "no-store",
        signal: controller.signal,
      })
      clearTimeout(t)
      break
    } catch (e) {
      clearTimeout(t)
      console.error(`[admin-proxy] upstream failed ${method} ${key} -> ${target} (attempt ${attempt}/2):`, e instanceof Error ? e.message : e)
      if (attempt < 2) await new Promise((r) => setTimeout(r, 300))
    }
  }
  if (!upstream) {
    const warmingUp = method === "GET"
    return NextResponse.json(
      {
        error: warmingUp ? "Service warming up — retrying..." : "Upstream unavailable",
        retryable: true,
        retryAfter: 3,
      },
      { status: warmingUp ? 503 : 502, headers: { "Retry-After": "3" } }
    )
  }

  const respBody = await upstream.arrayBuffer()
  const res = new NextResponse(respBody, { status: upstream.status })

  const ct = upstream.headers.get("content-type")
  if (ct) res.headers.set("Content-Type", ct)
  // Forwarded so api-client blob downloads can derive the export filename.
  const disposition = upstream.headers.get("content-disposition")
  if (disposition) res.headers.set("Content-Disposition", disposition)
  const setCookie = upstream.headers.getSetCookie?.() || []
  for (const sc of setCookie) res.headers.append("set-cookie", sc)
  if (setCookie.length === 0) {
    const single = upstream.headers.get("set-cookie")
    if (single) res.headers.set("set-cookie", single)
  }

  res.headers.set("Cache-Control", "no-store")
  return res
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const key = ["api", ...(path || [])].join("/")
  return proxy(req, key)
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const key = ["api", ...(path || [])].join("/")
  return proxy(req, key)
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const key = ["api", ...(path || [])].join("/")
  return proxy(req, key)
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const key = ["api", ...(path || [])].join("/")
  return proxy(req, key)
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const key = ["api", ...(path || [])].join("/")
  return proxy(req, key)
}
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const key = ["api", ...(path || [])].join("/")
  return proxy(req, key)
}