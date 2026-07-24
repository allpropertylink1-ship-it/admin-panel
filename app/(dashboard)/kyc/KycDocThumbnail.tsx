"use client"

import { isValidUrl } from "@/lib/utils"
import { FileText } from "@/components/ui/icons"

interface KycDocThumbnailProps {
  url: string | null
  label?: string
  className?: string
}

export function KycDocThumbnail({ url, label, className = "h-9 w-14" }: KycDocThumbnailProps) {
  if (!url) return null

  if (!isValidUrl(url)) {
    return (
      <span className={`flex items-center justify-center rounded-lg bg-gray-100 text-[10px] text-muted ${className}`}>
        Invalid URL
      </span>
    )
  }

  if (url.match(/\.pdf/i)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center rounded-lg bg-error-50 text-error/60 hover:bg-error-50/80 transition-colors ${className}`}
        title={label || "View PDF"}
      >
        <FileText size={16} />
      </a>
    )
  }

  return (
    <img
      src={url}
      alt={label || ""}
      className={`rounded-lg object-cover ring-1 ring-black/5 ${className}`}
      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
    />
  )
}
