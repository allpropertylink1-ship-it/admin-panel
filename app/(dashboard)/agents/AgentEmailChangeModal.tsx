"use client"

import { X, Loader2, CheckCircle } from "@/components/ui/icons"

interface Agent {
  id: string; fullName: string; email: string; phone: string; agentCode: string
  status: string; hasActivated: boolean; suspendedAt: string | null; suspendedReason: string | null
  createdAt: string; _count: { users: number }
}

interface AgentEmailChangeModalProps {
  target: Agent | null
  newEmail: string
  sent: boolean
  loading: boolean
  onSend: () => void
  onDone: () => void
  onCancel: () => void
}

export function AgentEmailChangeModal({ target, newEmail, sent, loading, onSend, onDone, onCancel }: AgentEmailChangeModalProps) {
  if (!target) return null

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle size={24} className="text-success" />
          </div>
          <h2 className="text-lg font-semibold">Verification Email Sent</h2>
          <p className="mt-2 text-sm text-muted">
            A verification email has been sent to <strong>{newEmail}</strong>. The representative must click the link and set a new password to complete the email change.
          </p>
          <p className="mt-2 text-sm text-muted">
            A notification was also sent to the current email <strong>{target.email}</strong>.
          </p>
          <button onClick={onDone}
            className="mt-6 rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Change Email Address</h2>
          <button onClick={onCancel} className="rounded-xl p-1.5 text-muted hover:bg-gray-50 hover:text-foreground transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl bg-primary-50 border border-primary/20 p-4 text-sm text-foreground">
            <p className="font-medium">Current email: <span className="font-mono">{target.email}</span></p>
            <p className="mt-2 font-medium">New email: <span className="font-mono">{newEmail}</span></p>
          </div>
          <div className="rounded-xl bg-warning/10 border border-warning/20 p-4 text-sm text-warning-800">
            <p className="font-medium">What will happen:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-muted">
              <li>A verification email will be sent to <strong>{newEmail}</strong></li>
              <li>A notification will be sent to <strong>{target.email}</strong></li>
              <li>The representative must click the link and set a new password to complete the change</li>
              <li>The verification link expires in 7 days</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={onSend} disabled={loading}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:opacity-50 inline-flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Sending..." : "Send Verification"}
          </button>
        </div>
      </div>
    </div>
  )
}
