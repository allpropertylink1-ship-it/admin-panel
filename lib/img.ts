const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.allpropertylink.co.ke"

/** Absolutize DB-relative /uploads/* paths (cPanel migration safety). */
export function absUpload(u: string | null | undefined): string | undefined {
  if (!u) return undefined
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`
  return u
}
