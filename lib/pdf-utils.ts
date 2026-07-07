export function resolvePdfUrl(url: string): string {
  return url
    .replace("/image/upload/", "/raw/upload/")
    .replace(/\.pdf$/i, "")
}
