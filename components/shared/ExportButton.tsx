"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Download, Loader2, X } from "@/components/ui/icons"

interface ExportButtonProps {
  /** Export endpoint incl. query params, e.g. `/api/admin/exports/claims?status=PAID`. */
  exportPath: string | (() => string)
  /** Fallback filename when the server sends no content-disposition. */
  filename: string
  label?: string
  className?: string
}

/**
 * Blob download via api-client (cookies forwarded, 401 auto-refreshes).
 * Replaces window.location.href exports so failures surface inline
 * instead of navigating to a JSON error page.
 */
export function ExportButton({ exportPath, filename, label = "Export", className }: ExportButtonProps) {
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(t)
  }, [toast])

  async function handleExport() {
    const path = typeof exportPath === "function" ? exportPath() : exportPath
    setDownloading(true)
    setToast(null)
    try {
      const { blob, filename: serverName, error } = await api.download(path)
      if (error || !blob) throw new Error(error || "Export failed")
      const name = serverName || filename
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 5000)
      setToast({ kind: "success", text: `Downloaded ${name}` })
    } catch (err) {
      setToast({ kind: "error", text: err instanceof Error ? err.message : "Export failed" })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={downloading}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-card disabled:opacity-50",
          className
        )}
      >
        {downloading ? <Loader2 size={16} /> : <Download size={16} />}
        {downloading ? "Exporting..." : label}
      </button>
      {toast && (
        <div
          aria-live="polite"
          role={toast.kind === "error" ? "alert" : "status"}
          className={cn(
            "flex max-w-xs items-start gap-2 rounded-xl border px-3 py-2 text-xs",
            toast.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
          )}
          <span className="min-w-0 flex-1 break-words">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="rounded-lg p-0.5 hover:bg-black/5"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
