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
  return u
}
