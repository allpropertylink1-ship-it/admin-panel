import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const API_BACKEND = process.env.API_BACKEND_URL || "https://delightful-encouragement-production-878d.up.railway.app"

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    const url = new URL(request.url)
    url.host = new URL(API_BACKEND).host
    url.protocol = "https"
    url.port = ""
    return NextResponse.rewrite(url.toString())
  }

  const devAuth = process.env.DEV_AUTH
  if (devAuth) {
    const auth = request.headers.get("authorization")
    const expected = "Basic " + Buffer.from(devAuth).toString("base64")
    if (auth !== expected) {
      return new NextResponse("Access denied", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="All Property Link (Dev)"' },
      })
    }
  }

  if (
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/_next")
  ) {
    const token = request.cookies.get("token")?.value
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  const response = NextResponse.next()
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}
