export function resolvePdfUrl(url: string): string {
  if (!url) return url
  let clean = url
  if (clean.includes("/image/upload/") && clean.endsWith(".pdf")) clean = clean.slice(0, -4)
  return `/api/upload/proxy?url=${encodeURIComponent(clean)}`
}
