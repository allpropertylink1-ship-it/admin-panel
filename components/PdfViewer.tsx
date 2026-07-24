"use client"

import { FileText, ExternalLink, Download, X } from "@/components/ui/icons"

function isValidUrl(str: string) {
  try {
    const url = new URL(str)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch { return false }
}

interface PdfViewerProps {
  url: string
  filename?: string
  onClose?: () => void
  compact?: boolean
}

export default function PdfViewer({ url, filename = "document", onClose, compact }: PdfViewerProps) {
  const directUrl = url

  if (compact) {
    return isValidUrl(directUrl) ? (
      <a href={directUrl} target="_blank" rel="noopener noreferrer"
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-gray-50 py-6 text-xs text-muted transition-colors hover:bg-gray-100 hover:text-primary"
      >
        <FileText size={24} className="text-red-400" />
        <span className="flex items-center gap-1 font-medium">
          Open PDF <ExternalLink size={10} />
        </span>
      </a>
    ) : (
      <span className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-gray-50 py-6 text-xs text-muted">
        <FileText size={24} className="text-red-400" />
        <span>Invalid URL</span>
      </span>
    )
  }

  return (
    <div className="relative flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-red-400" />
          <span className="text-sm font-medium text-foreground">{filename}</span>
        </div>
        <div className="flex items-center gap-1">
          {isValidUrl(directUrl) ? (
            <a href={directUrl} target="_blank" rel="noopener noreferrer" download
              className="rounded p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
              title="Download PDF"
            >
              <Download size={14} />
            </a>
          ) : (
            <span className="rounded p-1 text-muted" title="Invalid URL"><Download size={14} /></span>
          )}
          {onClose && (
            <button onClick={onClose}
              className="rounded p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      {isValidUrl(directUrl) ? (
        <a href={directUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 rounded-lg border border-border bg-gray-50 py-16 text-sm text-muted transition-colors hover:bg-gray-100 hover:text-primary"
        >
          <FileText size={32} className="text-red-400" />
          <span className="flex items-center gap-1.5 font-medium">
            Open PDF in new tab <ExternalLink size={14} />
          </span>
        </a>
      ) : (
        <span className="flex items-center justify-center gap-3 rounded-lg border border-border bg-gray-50 py-16 text-sm text-muted">
          <FileText size={32} className="text-red-400" />
          <span>Invalid URL</span>
        </span>
      )}
    </div>
  )
}
