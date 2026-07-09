export function resolvePdfUrl(url: string): string {
  if (url.includes("/image/upload/") && url.endsWith(".pdf")) return url.slice(0, -4)
  return url
}
