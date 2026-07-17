"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  AlertCircle, Loader2, Plus, Trash2, ShieldCheck,
} from "lucide-react"
import { BulkActionsBar } from "@/components/BulkActionsBar"

interface Admin {
  id: string; email: string; fullName: string; role: string; createdAt: string
}

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ email: "", fullName: "", password: "" })
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await api.get<{ admins: Admin[] }>("/api/admin/admins")
      if (error || !data) throw new Error(error || "No data")
      setAdmins(data.admins)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load admins")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    if (!formData.email || !formData.fullName || !formData.password) {
      setFormError("All fields are required"); return
    }
    if (formData.password.length < 8) {
      setFormError("Password must be at least 8 characters"); return
    }
    setFormLoading(true)
    try {
      const { error } = await api.post("/api/admin/admins", formData)
      if (error) throw new Error(error)
      setShowModal(false)
      setFormData({ email: "", fullName: "", password: "" })
      await fetchAdmins()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create admin")
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id)
    setDeleteConfirm(null)
    try {
      const { error } = await api.delete(`/api/admin/admins/${id}`)
      if (error) throw new Error(error)
      await fetchAdmins()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete admin")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Admin Accounts</h1>
          <p className="mt-1 text-sm text-muted">Manage platform administrators</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all inline-flex items-center gap-2 shadow-sm">
          <Plus size={16} />
          Add Admin
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-error-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200">Dismiss</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted">
            <ShieldCheck size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground/60">No admin accounts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="w-10 px-2 py-3.5 text-left">
                    <input type="checkbox"
                      checked={admins.length > 0 && selectedIds.length === admins.length}
                      onChange={() => {
                        if (selectedIds.length === admins.length) { setSelectedIds([]) }
                        else { setSelectedIds(admins.map(a => a.id)) }
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Email</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Role</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Created</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {admins.map((admin) => (
                  <tr key={admin.id} className={cn("transition-colors hover:bg-gray-50/40", selectedIds.includes(admin.id) && "bg-primary/5")}>
                    <td className="w-10 px-2 py-3">
                      <input type="checkbox"
                        checked={selectedIds.includes(admin.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(admin.id) ? prev.filter(id => id !== admin.id) : [...prev, admin.id])}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-xs font-bold text-accent">
                          {admin.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{admin.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">{admin.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted tabular-nums">
                      {new Date(admin.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => setDeleteConfirm(admin.id)} disabled={actionLoading === admin.id}
                          className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Delete">
                          {actionLoading === admin.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                      {deleteConfirm === admin.id && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteConfirm(null)}>
                          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-base font-semibold text-foreground">Delete admin?</h3>
                            <p className="mt-2 text-sm text-muted">Remove <strong>{admin.fullName}</strong> ({admin.email}) from admin accounts.</p>
                            <div className="mt-5 flex justify-end gap-3">
                              <button onClick={() => setDeleteConfirm(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50">Cancel</button>
                              <button onClick={() => handleDelete(admin.id)} disabled={actionLoading === admin.id}
                                className="rounded-xl bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                                {actionLoading === admin.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        actions={[
          { label: "Delete", action: "delete", variant: "destructive", requiresConfirmation: true },
        ]}
        onAction={async (action) => {
          setLoading(true)
          try {
            const { error } = await api.post("/api/admin/admins/bulk", { ids: selectedIds, action })
            if (error) throw new Error(error)
            setSelectedIds([])
            await fetchAdmins()
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Bulk action failed")
          } finally {
            setLoading(false)
          }
        }}
        loading={loading}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-foreground">Add New Admin</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Full Name</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="admin@allpropertylink.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="Min. 8 characters" />
              </div>
              {formError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle size={12} /> {formError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formLoading}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 inline-flex items-center gap-2">
                  {formLoading && <Loader2 size={14} className="animate-spin" />}
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
