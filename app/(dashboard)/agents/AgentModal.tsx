"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "@/components/ui/icons"
import type { Agent } from "./types"

interface AgentModalProps {
  open: boolean
  editingAgent: Agent | null
  formLoading: boolean
  formError: string
  onClose: () => void
  onSubmit: (data: { fullName: string; email: string; phone: string }) => void
}

export default function AgentModal({ open, editingAgent, formLoading, formError, onClose, onSubmit }: AgentModalProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (open) {
      setFullName(editingAgent?.fullName ?? "")
      setEmail(editingAgent?.email ?? "")
      setPhone(editingAgent?.phone ?? "")
    }
  }, [open, editingAgent])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editingAgent ? "Edit Representative" : "Add Representative"}</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-muted hover:bg-gray-50 hover:text-foreground transition-all">
            <X size={18} />
          </button>
        </div>
        {formError && (
          <div className="rounded-xl bg-error-50 px-4 py-2.5 text-sm text-red-700 border border-red-100 mb-4">{formError}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="modal-fullName">Full Name</label>
            <input id="modal-fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="e.g. Joe Davis" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="modal-email">Email Address</label>
            <input id="modal-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="agent@allpropertylink.co.ke" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="modal-phone">Phone Number</label>
            <input id="modal-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm w-full placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="+254 7XX XXX XXX" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={() => onSubmit({ fullName, email, phone })} disabled={formLoading}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:opacity-50 inline-flex items-center gap-2">
            {formLoading && <Loader2 size={14} className="animate-spin" />}
            {formLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
