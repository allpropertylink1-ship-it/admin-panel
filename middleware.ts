import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const API_BACKEND = process.env.API_BACKEND_URL || "https://api.allpropertylink.co.ke"

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/uploads/")) {
    // Images live on the cPanel origin, which is unreachable from some
    // user networks (host-level IP filtering on :80/:443). Serve them
    // same-origin through the Vercel proxy so <img> tags never depend on
    // a direct browser -> origin connection.
    const url = new URL(request.url)
    url.host = new URL(API_BACKEND).host
    url.protocol = "https"
    url.port = ""
    return NextResponse.rewrite(url.toString())
  }

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
    // Either cookie grants entry: the access cookie expires after 15 min but
    // /api/auth/me rotates a valid refresh token into a fresh pair, so gating
    // on the access cookie alone bounced admins to login on every refresh.
    const access = request.cookies.get("access_token")?.value
    const refresh = request.cookies.get("refresh_token")?.value
    if (!access && !refresh) {
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
