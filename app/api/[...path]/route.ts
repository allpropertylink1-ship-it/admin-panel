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

  let upstream: Response
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 8000)
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(t)
    console.error(`[admin-proxy] upstream failed ${method} ${key} -> ${target}:`, e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 })
  } finally {
    clearTimeout(t)
  }

  const respBody = await upstream.arrayBuffer()
  const res = new NextResponse(respBody, { status: upstream.status })

  const ct = upstream.headers.get("content-type")
  if (ct) res.headers.set("Content-Type", ct)
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