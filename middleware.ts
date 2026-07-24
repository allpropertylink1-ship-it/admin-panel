import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function middleware(request: NextRequest) {
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
  const isDev = process.env.NODE_ENV === "development"
  const scriptSrc = isDev
    ? "'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://upload-widget.cloudinary.com"
    : "'self' 'unsafe-inline' https://accounts.google.com https://upload-widget.cloudinary.com"
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
  response.headers.set("Content-Security-Policy", `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://accounts.google.com https://upload-widget.cloudinary.com https://fonts.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com https://upload-widget.cloudinary.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.allpropertylink.co.ke https://api.cloudinary.com https://upload-widget.cloudinary.com; frame-src 'self' https://accounts.google.com https://upload-widget.cloudinary.com https://widget.cloudinary.com https://cloudinary.com; object-src 'none'`)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}
