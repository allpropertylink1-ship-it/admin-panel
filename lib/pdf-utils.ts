export function resolvePdfUrl(url: string): string {
  if (!url) return url
  return `/api/upload/proxy?url=${encodeURIComponent(url)}`
}
