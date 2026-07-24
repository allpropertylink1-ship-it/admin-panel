"use client"

import { X } from "@/components/ui/icons"

interface AgentCredentialsModalProps {
  credentials: { email: string; agentCode: string; name: string } | null
  onClose: () => void
}

export function AgentCredentialsModal({ credentials, onClose }: AgentCredentialsModalProps) {
  if (!credentials) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Representative Created</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-muted hover:bg-gray-50 hover:text-foreground transition-all">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted mb-4">
          An activation email has been sent to <strong>{credentials.name}</strong>. They can also use their agent code to sign in.
        </p>
        <div className="rounded-xl bg-primary-50 border border-primary/20 p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">Email</label>
            <p className="mt-0.5 font-mono text-sm font-medium">{credentials.email}</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">Agent Code</label>
            <p className="mt-0.5 font-mono text-sm font-medium">{credentials.agentCode}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => {
            navigator.clipboard.writeText(`Email: ${credentials.email}\nAgent Code: ${credentials.agentCode}`)
          }} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">
            Copy Credentials
          </button>
          <button onClick={onClose} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
