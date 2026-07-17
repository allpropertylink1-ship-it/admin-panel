"use client"

import { useState } from "react"

interface BulkAction {
  label: string
  action: string
  variant?: "default" | "destructive"
  requiresConfirmation?: boolean
}

interface BulkActionsBarProps {
  selectedIds: string[]
  onClear: () => void
  actions: BulkAction[]
  onAction: (action: string) => Promise<void> | void
  loading?: boolean
}

export function BulkActionsBar({ selectedIds, onClear, actions, onAction, loading }: BulkActionsBarProps) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  if (selectedIds.length === 0) return null

  const handleAction = (a: string) => {
    const actionDef = actions.find((x) => x.action === a)
    if (actionDef?.requiresConfirmation) {
      setConfirmAction(a)
    } else {
      onAction(a)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-lg">
        <span className="whitespace-nowrap text-sm font-medium text-amber-800">
          {selectedIds.length} selected
        </span>
        <div className="h-5 w-px bg-amber-200" />
        {actions.map((actionDef) => (
          <button
            key={actionDef.action}
            onClick={() => handleAction(actionDef.action)}
            disabled={loading}
            className={`touch-target inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
              actionDef.variant === "destructive"
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-white text-amber-800 hover:bg-amber-100"
            }`}
          >
            {actionDef.label}
          </button>
        ))}
        <div className="h-5 w-px bg-amber-200" />
        <button
          onClick={onClear}
          disabled={loading}
          className="touch-target whitespace-nowrap text-sm font-medium text-muted hover:text-foreground transition-colors disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              Confirm {actions.find((a) => a.action === confirmAction)?.label.toLowerCase()}?
            </h3>
            <p className="mt-2 text-sm text-muted">
              This will affect {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""}.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={loading}
                className="touch-target rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmAction(null); onAction(confirmAction) }}
                disabled={loading}
                className={`touch-target rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  actions.find((a) => a.action === confirmAction)?.variant === "destructive"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-primary-hover"
                }`}
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
