"use client"

import { useState } from "react"
import { FileText, Download, Loader2, X, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PdfViewerProps {
  url: string
  filename?: string
  onClose?: () => void
  compact?: boolean
}

export default function PdfViewer({ url, filename = "document", onClose, compact }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const proxyUrl = `/api/upload/proxy?url=${encodeURIComponent(url)}`

  if (error && compact) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-gray-50 py-10 text-muted">
        <FileText size={40} className="text-red-400" />
        <p className="text-sm font-medium">Failed to load PDF</p>
        <a href={url} target="_blank" rel="noopener noreferrer" download
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Download size={14} /> Download PDF
        </a>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-gray-50 py-6 transition-colors hover:bg-gray-100">
        {loading && <Loader2 size={20} className="animate-spin text-muted" />}
        <embed
          src={proxyUrl}
          type="application/pdf"
          className={cn("h-48 w-full", loading ? "hidden" : "")}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true) }}
        />
        {!loading && !error && (
          <>
            <a href={proxyUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Maximize2 size={12} /> Open full screen
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer" download
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
            >
              <Download size={12} /> Download
            </a>
          </>
        )}
      </div>
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
          <a href={url} target="_blank" rel="noopener noreferrer" download
            className="rounded p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
            title="Download PDF"
          >
            <Download size={14} />
          </a>
          {onClose && (
            <button onClick={onClose}
              className="rounded p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-border bg-gray-50" style={{ height: expanded ? "80vh" : "400px" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        )}
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
            <FileText size={48} className="text-red-400" />
            <p className="text-sm font-medium">Failed to load PDF</p>
            <a href={url} target="_blank" rel="noopener noreferrer" download
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Download size={14} /> Download PDF
            </a>
          </div>
        ) : (
          <iframe
            src={`${proxyUrl}&inline=1`}
            className="h-full w-full border-0"
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true) }}
            title={filename}
          />
        )}
      </div>
      <div className="mt-1 flex items-center justify-end gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
        >
          {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
    </div>
  )
}