"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Search,
  Users,
  UserPlus,
  Eye,
  X,
  Loader2,
  Pencil,
  Trash2,
  UserCheck,
  Hash,
} from "lucide-react";

interface AplAgent {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  agentCode: string;
  createdAt: string;
  _count: { users: number };
}

interface ReffedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  category: string | null;
  accountStatus: string;
  kycStatus: string;
  createdAt: string;
  _count: { properties: number };
}

interface AgentDetail extends AplAgent {
  users: ReffedUser[];
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AplAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAgent, setEditAgent] = useState<AplAgent | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const { data: result, error } = await api.get<{ agents: AplAgent[]; total: number }>(`/api/admin/agents?${params.toString()}`);
      if (error || !result) throw new Error(error || "No data");
      setAgents(result.agents ?? []);
    } catch (error) {
      console.warn("[APL-AGENTS] Failed to fetch:", error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchAgents() }, [fetchAgents]);

  async function handleAddAgent() {
    setFormError("");
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError("All fields are required"); return
    }
    setFormLoading(true);
    try {
      const { data, error } = await api.post<{ agent: AplAgent }>("/api/admin/agents", form);
      if (error || !data) { setFormError(error || "Failed to create agent"); return }
      setAgents((prev) => [data.agent, ...prev]);
      setShowAddModal(false);
      setForm({ fullName: "", email: "", phone: "" });
    } finally { setFormLoading(false) }
  }

  async function handleEditAgent() {
    if (!editAgent) return
    setFormError("");
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError("All fields are required"); return
    }
    setFormLoading(true);
    try {
      const { data, error } = await api.patch<{ agent: AplAgent }>(`/api/admin/agents/${editAgent.id}`, form);
      if (error || !data) { setFormError(error || "Failed to update agent"); return }
      setAgents((prev) => prev.map((a) => a.id === editAgent.id ? data.agent : a));
      setShowEditModal(false);
      setEditAgent(null);
    } finally { setFormLoading(false) }
  }

  async function handleDeleteAgent(id: string) {
    if (!confirm("Are you sure you want to delete this APL Agent? This action cannot be undone.")) return
    setActionLoading(id);
    try {
      const { error } = await api.delete(`/api/admin/agents/${id}`);
      if (!error) setAgents((prev) => prev.filter((a) => a.id !== id));
    } finally { setActionLoading(null) }
  }

  function openEditModal(agent: AplAgent) {
    setEditAgent(agent);
    setForm({ fullName: agent.fullName, email: agent.email, phone: agent.phone });
    setFormError("");
    setShowEditModal(true);
  }

  function openDetail(agent: AplAgent) {
    setActionLoading(agent.id);
    api.get<{ agent: AgentDetail }>(`/api/admin/agents/${agent.id}`).then(({ data, error }) => {
      if (data?.agent) setSelectedAgent(data.agent);
      setActionLoading(null);
    });
  }

  const totalReferred = agents.reduce((s, a) => s + a._count.users, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">APL Agents</h1>
          <p className="mt-1 text-sm text-muted">
            All Property Link employees who onboard users onto the platform.
          </p>
        </div>
        <button
          onClick={() => { setForm({ fullName: "", email: "", phone: "" }); setFormError(""); setShowAddModal(true) }}
          className="touch-target inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <UserPlus size={16} /> Add Agent
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total APL Agents</p>
              <p className="text-xl font-bold text-foreground">{agents.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <UserCheck size={20} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-muted">Total Referred Users</p>
              <p className="text-xl font-bold text-foreground">{totalReferred}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <label htmlFor="search-agents" className="sr-only">Search APL agents by name, email, or code</label>
            <input
              id="search-agents" type="text" placeholder="Search by name, email, or code..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : agents.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">No APL agents found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted">Agent Code</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Full Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Phone</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Users Referred</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Onboarded</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-border last:border-0 hover:bg-background/50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-medium text-primary">
                        <Hash size={12} /> {agent.agentCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{agent.fullName}</td>
                    <td className="px-4 py-3 text-muted">{agent.email}</td>
                    <td className="px-4 py-3 text-muted">{agent.phone}</td>
                    <td className="px-4 py-3 text-center font-medium text-foreground">{agent._count.users}</td>
                    <td className="px-4 py-3 text-muted">{new Date(agent.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(agent)} disabled={actionLoading === agent.id}
                          className="touch-target rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground" title="View details">
                          {actionLoading === agent.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                        </button>
                        <button onClick={() => openEditModal(agent)}
                          className="touch-target rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteAgent(agent.id)} disabled={actionLoading === agent.id}
                          className="touch-target rounded-lg p-2 text-error/70 transition-colors hover:bg-error/10 hover:text-error" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <AgentFormModal title="Add APL Agent" form={form} setForm={setForm} error={formError} loading={formLoading} onSave={handleAddAgent} onClose={() => setShowAddModal(false)} />
      )}
      {showEditModal && (
        <AgentFormModal title="Edit APL Agent" form={form} setForm={setForm} error={formError} loading={formLoading} onSave={handleEditAgent} onClose={() => { setShowEditModal(false); setEditAgent(null) }} />
      )}

      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">APL Agent Details</h2>
              <button onClick={() => setSelectedAgent(null)} className="touch-target rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {selectedAgent.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{selectedAgent.fullName}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-medium text-primary">
                    <Hash size={12} /> {selectedAgent.agentCode}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted">Email</p><p className="font-medium text-foreground">{selectedAgent.email}</p></div>
                <div><p className="text-muted">Phone</p><p className="font-medium text-foreground">{selectedAgent.phone}</p></div>
                <div><p className="text-muted">Users Referred</p><p className="font-medium text-foreground">{selectedAgent._count.users}</p></div>
                <div><p className="text-muted">Onboarded</p><p className="font-medium text-foreground">{new Date(selectedAgent.createdAt).toLocaleDateString()}</p></div>
              </div>

              {selectedAgent.users.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Referred Users ({selectedAgent.users.length})</h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-background">
                          <th className="px-3 py-2 text-left font-medium text-muted">Name</th>
                          <th className="px-3 py-2 text-left font-medium text-muted">Email</th>
                          <th className="px-3 py-2 text-left font-medium text-muted">Category</th>
                          <th className="px-3 py-2 text-center font-medium text-muted">Listings</th>
                          <th className="px-3 py-2 text-left font-medium text-muted">Status</th>
                          <th className="px-3 py-2 text-left font-medium text-muted">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAgent.users.map((u: ReffedUser) => (
                          <tr key={u.id} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 font-medium text-foreground">{u.firstName} {u.lastName}</td>
                            <td className="px-3 py-2 text-muted">{u.email ?? "—"}</td>
                            <td className="px-3 py-2 text-muted">{u.category ?? "—"}</td>
                            <td className="px-3 py-2 text-center text-foreground">{u._count.properties}</td>
                            <td className="px-3 py-2">
                              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", u.accountStatus === "ACTIVE" ? "bg-success/10 text-success" : u.accountStatus === "PENDING_APPROVAL" ? "bg-warning/10 text-warning" : "bg-error/10 text-error")}>
                                {u.accountStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentFormModal({ title, form, setForm, error, loading, onSave, onClose }: {
  title: string; form: { fullName: string; email: string; phone: string };
  setForm: (f: { fullName: string; email: string; phone: string }) => void;
  error: string; loading: boolean; onSave: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="touch-target rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          {error && <div className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{error}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="fullName">Full Name</label>
            <input id="fullName" type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Joe Davis" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="email">Email Address</label>
            <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="agent@allpropertylink.co.ke" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="phone">Phone Number</label>
            <input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="+254 7XX XXX XXX" />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button onClick={onClose} className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-background">Cancel</button>
          <button onClick={onSave} disabled={loading}
            className="touch-target rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
