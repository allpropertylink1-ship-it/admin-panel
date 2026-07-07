"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
} from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string | null } | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_OPTIONS = [
  "",
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "SUSPEND",
  "ACTIVATE",
  "APPROVE",
  "REJECT",
];

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchAudit = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const { data, error } = await api.get<{ logs: AuditEntry[]; pagination: PaginationMeta }>(`/api/admin/audit?${params.toString()}`);
      if (error) throw new Error(error);
      if (!data) { setEntries([]); return; }
      setEntries(data.logs ?? []);
      setMeta(data.pagination);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, fromDate, toDate]);

  useEffect(() => {
    fetchAudit(meta.page);
  }, [fetchAudit]);

  function goToPage(p: number) {
    if (p < 1 || p > meta.totalPages) return;
    setMeta((prev) => ({ ...prev, page: p }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="mt-1 text-sm text-muted">
          Track all actions performed across the platform.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Search entity type or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted shrink-0" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Actions</option>
                {ACTION_OPTIONS.filter(Boolean).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-sm text-muted">—</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">
              No audit entries found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted">
                    Timestamp
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted">
                    Action
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted">
                    Entity Type
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted">
                    Entity ID
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted">
                    User
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border last:border-0 hover:bg-background/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          entry.action === "CREATE" &&
                            "bg-success/10 text-success",
                          entry.action === "UPDATE" &&
                            "bg-primary/10 text-primary",
                          entry.action === "DELETE" &&
                            "bg-error/10 text-error",
                          entry.action === "LOGIN" &&
                            "bg-blue-500/10 text-blue-500",
                          entry.action === "LOGOUT" &&
                            "bg-gray-500/10 text-gray-500",
                          !["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"].includes(
                            entry.action
                          ) && "bg-warning/10 text-warning"
                        )}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {entry.entityType}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {entry.entityId
                        ? `${entry.entityId.slice(0, 8)}...`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground">
                      {entry.user
                        ? `${entry.user.firstName} ${entry.user.lastName}`
                        : "System"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {entry.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted">
              Page {meta.page} of {meta.totalPages} ({meta.total} entries)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(meta.page - 1)}
                disabled={meta.page <= 1}
                className="touch-target rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from(
                { length: Math.min(meta.totalPages, 5) },
                (_, i) => {
                  const start = Math.max(
                    1,
                    Math.min(
                      meta.page - 2,
                      meta.totalPages - 4
                    )
                  );
                  const p = start + i;
                  if (p > meta.totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={cn(
                        "touch-target flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                        p === meta.page
                          ? "bg-primary text-white"
                          : "text-muted hover:bg-background hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  );
                }
              )}
              <button
                onClick={() => goToPage(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="touch-target rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
