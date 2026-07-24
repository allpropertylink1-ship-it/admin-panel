"use client"

import { X, Loader2, CheckCircle } from "@/components/ui/icons"

interface Agent {
  id: string; fullName: string; email: string; phone: string; agentCode: string
  status: string; hasActivated: boolean; suspendedAt: string | null; suspendedReason: string | null
  createdAt: string; _count: { users: number }
}

interface AgentResendInviteModalProps {
  target: Agent | null
  done: boolean
  loading: boolean
  onSend: () => void
  onDone: () => void
  onCancel: () => void
}

export function AgentResendInviteModal({ target, done, loading, onSend, onDone, onCancel }: AgentResendInviteModalProps) {
  if (!target && !done) return null

  if (done && target) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle size={24} className="text-success" />
          </div>
          <h2 className="text-lg font-semibold">Invitation Sent</h2>
          <p className="mt-2 text-sm text-muted">
            An activation email has been sent to <strong>{target.email}</strong>.
          </p>
          <button onClick={onDone}
            className="mt-6 rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all">
            Done
          </button>
        </div>
      </div>
    )
  }

  if (!target) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Resend Invitation</h2>
        <p className="mt-2 text-sm text-muted">
          Send a new activation email to <strong>{target.fullName}</strong> ({target.email})?
        </p>
        <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 mt-4 text-sm">
          <p className="font-medium text-accent">This will:</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-muted">
            <li>Generate a new activation link (previous ones will still work)</li>
            <li>Send an email with their APL Representative Code</li>
            <li>The link expires in 7 days</li>
          </ul>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={onSend} disabled={loading}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-all disabled:opacity-50 inline-flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </div>
    </div>
  )
}
