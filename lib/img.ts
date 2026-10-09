const API_BASE = "https://api.allpropertylink.co.ke"

/**
 * Absolutize DB-relative /uploads/* paths (cPanel migration safety).
 * Relative paths stay relative so the browser loads them same-origin
 * through the /uploads middleware proxy (the cPanel origin is not
 * directly reachable from all user networks). Absolute cPanel URLs are
 * rewritten to the same-origin proxy for the same reason.
 */
export function absUpload(u: string | null | undefined): string | undefined {
  if (!u) return undefined
  if (u.startsWith("/uploads/")) return u
  if (u.startsWith(`${API_BASE}/uploads/`)) return u.slice(API_BASE.length)
  // Legacy old-site URLs (e.g. https://allpropertylink.com/uploads/...) —
  // file lives on the backend now, so rewrite to same-origin relative path
  // which loads through the /uploads proxy.
  const legacy = u.match(/https?:\/\/[^/]*allpropertylink[^/]*(\/uploads\/.*)/i)
  if (legacy) return legacy[1]
  // Generic fallback: any absolute URL containing /uploads/ → relative.
  const idx = u.indexOf("/uploads/")
  if (idx !== -1 && /^https?:\/\//i.test(u)) return u.slice(idx)
  return u
}
