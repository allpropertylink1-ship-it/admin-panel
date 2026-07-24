"use client"

import { Loader2, CheckCircle, XCircle } from "@/components/ui/icons"

interface ApprovalActionsProps {
  userId: string
  actionLoading: string | null
  rejectInput: string | null
  rejectReason: string
  onApprove: (userId: string) => void
  onRejectClick: (userId: string) => void
  onRejectConfirm: (userId: string) => void
  onRejectCancel: () => void
  onRejectReasonChange: (reason: string) => void
}

export function ApprovalActions({
  userId, actionLoading, rejectInput, rejectReason,
  onApprove, onRejectClick, onRejectConfirm, onRejectCancel, onRejectReasonChange,
}: ApprovalActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={() => onApprove(userId)}
        disabled={actionLoading === userId}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-hover disabled:opacity-50"
      >
        {actionLoading === userId ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle size={16} />
        )}
        {actionLoading === userId ? "Approving..." : "Approve"}
      </button>

      {rejectInput === userId ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder="Reason for rejection..."
            className="rounded-xl border border-border bg-card/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-error focus:outline-none focus:ring-2 focus:ring-error/15 w-full sm:w-56"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onRejectConfirm(userId)
              if (e.key === "Escape") onRejectCancel()
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => onRejectConfirm(userId)}
              disabled={actionLoading === userId || !rejectReason.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-error px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading === userId ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Reject
            </button>
            <button
              onClick={onRejectCancel}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onRejectClick(userId)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/30 bg-error-50 px-5 py-2.5 text-sm font-medium text-red-700 transition-all hover:bg-red-100"
        >
          <XCircle size={16} />
          Reject
        </button>
      )}
    </div>
  )
}