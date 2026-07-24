"use client"

import { Pencil, Ban, CheckCircle, Mail, Trash2, Loader2 } from "@/components/ui/icons"
import type { Agent } from "./types"

interface AgentActionsProps {
  agent: Agent
  suspendTarget: Agent | null
  deleteTarget: Agent | null
  suspendReason: string
  suspendLoading: boolean
  deleteLoading: boolean
  onEdit: () => void
  onSuspend: () => void
  onReactivate: () => void
  onResendInvite: () => void
  onDeleteConfirm: () => void
  onSuspendReasonChange: (reason: string) => void
  onSuspendConfirm: () => void
  onSuspendCancel: () => void
  onDeleteCancel: () => void
  onDeleteConfirmAction: () => void
}

export default function AgentActions({
  agent, suspendTarget, deleteTarget, suspendReason, suspendLoading, deleteLoading,
  onEdit, onSuspend, onReactivate, onResendInvite, onDeleteConfirm,
  onSuspendReasonChange, onSuspendConfirm, onSuspendCancel,
  onDeleteCancel, onDeleteConfirmAction,
}: AgentActionsProps) {
  return (
    <>
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors">
          <Pencil size={13} />
          Edit
        </button>
        {!agent.hasActivated && (
          <button onClick={onResendInvite}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors">
            <Mail size={13} />
            Resend Invite
          </button>
        )}
        {agent.status === "ACTIVE" ? (
          <button onClick={onSuspend}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/10 transition-colors">
            <Ban size={13} />
            Suspend
          </button>
        ) : (
          <button onClick={onReactivate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10 transition-colors">
            <CheckCircle size={13} />
            Reactivate
          </button>
        )}
        <button onClick={onDeleteConfirm}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error-50 transition-colors">
          <Trash2 size={13} />
          Delete
        </button>
      </div>

      {deleteTarget?.id === agent.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">Delete Agent</h2>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to delete <strong>{deleteTarget.fullName}</strong> ({deleteTarget.agentCode})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onDeleteCancel} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={onDeleteConfirmAction} disabled={deleteLoading}
                className="rounded-xl bg-error px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-all disabled:opacity-50 inline-flex items-center gap-2">
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendTarget?.id === agent.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">Suspend Agent</h2>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to suspend <strong>{suspendTarget.fullName}</strong> ({suspendTarget.agentCode})?
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium" htmlFor="suspendReason">Reason for suspension</label>
              <textarea id="suspendReason" value={suspendReason} onChange={(e) => onSuspendReasonChange(e.target.value)}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 min-h-[80px]"
                placeholder="Explain why this agent is being suspended..." />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onSuspendCancel} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={onSuspendConfirm} disabled={suspendLoading || !suspendReason.trim()}
                className="rounded-xl bg-warning px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-all disabled:opacity-50 inline-flex items-center gap-2">
                {suspendLoading && <Loader2 size={14} className="animate-spin" />}
                {suspendLoading ? "Suspending..." : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
