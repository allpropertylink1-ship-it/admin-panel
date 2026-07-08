"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Eye,
  X,
  Loader2,
  Shield,
  ShieldOff,
} from "lucide-react";

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  agencyName: string | null;
  agentLicense: string | null;
  accountStatus: string;
  createdAt: string;
  _count: { properties: number };
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const { data: result, error } = await api.get<{ agents: Agent[] }>(`/api/admin/agents?${params.toString()}`);
      if (error || !result) throw new Error(error || "No data");
      setAgents(result.agents ?? []);
    } catch (error) {
      console.warn("[AGENTS] Failed to fetch:", error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  async function handleToggleStatus(agent: Agent) {
    setActionLoading(agent.id);
    const newStatus =
      agent.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const { data: _, error } = await api.patch(`/api/admin/agents/${agent.id}`, { accountStatus: newStatus });
      if (!error) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id ? { ...a, accountStatus: newStatus } : a
          )
        );
        if (selectedAgent?.id === agent.id)
          setSelectedAgent({ ...selectedAgent, accountStatus: newStatus });
      }
    } finally {
      setActionLoading(null);
    }
  }

  const activeCount = agents.filter((a) => a.accountStatus === "ACTIVE").length;
  const totalCount = agents.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agents</h1>
        <p className="mt-1 text-sm text-muted">
          Manage all registered agents on the platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total Agents</p>
              <p className="text-xl font-bold text-foreground">{totalCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <UserCheck size={20} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-muted">Active</p>
              <p className="text-xl font-bold text-foreground">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10">
              <UserX size={20} className="text-error" />
            </div>
            <div>
              <p className="text-sm text-muted">Inactive / Suspended</p>
              <p className="text-xl font-bold text-foreground">
                {totalCount - activeCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <label htmlFor="search-agents" className="sr-only">Search agents by name or email</label>
            <input
              id="search-agents"
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "touch-target rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === f
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-background"
                )}
              >
                {f === "ALL" ? "All" : f === "ACTIVE" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : agents.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">
              No agents found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Agency
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    License
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Properties
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="border-b border-border last:border-0 hover:bg-background/50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {agent.firstName} {agent.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {agent.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {agent.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {agent.agencyName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {agent.agentLicense ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground">
                      {agent._count.properties}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          agent.accountStatus === "ACTIVE"
                            ? "bg-success/10 text-success"
                            : "bg-error/10 text-error"
                        )}
                      >
                        {agent.accountStatus === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          className="touch-target rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground"
                          title="View profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(agent)}
                          disabled={actionLoading === agent.id}
                          className={cn(
                            "touch-target rounded-lg p-2 transition-colors",
                            agent.accountStatus === "ACTIVE"
                              ? "text-error hover:bg-error/10 hover:text-error"
                              : "text-success hover:bg-success/10 hover:text-success",
                            actionLoading === agent.id && "opacity-50"
                          )}
                          title={
                            agent.accountStatus === "ACTIVE"
                              ? "Suspend"
                              : "Activate"
                          }
                        >
                          {actionLoading === agent.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : agent.accountStatus === "ACTIVE" ? (
                            <ShieldOff size={16} />
                          ) : (
                            <Shield size={16} />
                          )}
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

      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                Agent Profile
              </h2>
              <button
                onClick={() => setSelectedAgent(null)}
                className="touch-target rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {selectedAgent.firstName[0]}
                  {selectedAgent.lastName[0]}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedAgent.firstName} {selectedAgent.lastName}
                  </p>
                  <p className="text-sm text-muted">{selectedAgent.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted">Phone</p>
                  <p className="font-medium text-foreground">
                    {selectedAgent.phone ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Agency</p>
                  <p className="font-medium text-foreground">
                    {selectedAgent.agencyName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted">License</p>
                  <p className="font-medium text-foreground">
                    {selectedAgent.agentLicense ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Properties</p>
                  <p className="font-medium text-foreground">
                    {selectedAgent._count.properties}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Status</p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      selectedAgent.accountStatus === "ACTIVE"
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error"
                    )}
                  >
                    {selectedAgent.accountStatus === "ACTIVE"
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
                <div>
                  <p className="text-muted">Joined</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedAgent.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => setSelectedAgent(null)}
                className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-background"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleToggleStatus(selectedAgent);
                }}
                disabled={actionLoading === selectedAgent.id}
                className={cn(
                  "touch-target rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
                  selectedAgent.accountStatus === "ACTIVE"
                    ? "bg-error hover:bg-error/90"
                    : "bg-success hover:bg-success/90",
                  actionLoading === selectedAgent.id && "opacity-50"
                )}
              >
                {actionLoading === selectedAgent.id
                  ? "Please wait..."
                  : selectedAgent.accountStatus === "ACTIVE"
                  ? "Suspend Agent"
                  : "Activate Agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
