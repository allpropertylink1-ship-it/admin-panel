"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  Trash2,
  X,
  AlertCircle,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accountStatus: string;
  kycStatus: string;
  createdAt: string;
  phone?: string;
  category?: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const FILTERS = ["All", "Active", "Pending", "Suspended"];
const ROLES = ["APPLICANT", "AGENT", "ADMIN"];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700",
    PENDING_APPROVAL: "bg-amber-50 text-amber-700",
    SUSPENDED: "bg-red-50 text-red-700",
    ACTIVE: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
  };
  return map[status] || "bg-gray-50 text-gray-600";
};

const kycBadge = (status: string) => {
  const map: Record<string, string> = {
    VERIFIED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    REJECTED: "bg-red-50 text-red-700",
    NONE: "bg-gray-50 text-gray-600",
  };
  return map[status] || "bg-gray-50 text-gray-600";
};

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: "bg-red-50 text-red-700",
    AGENT: "bg-blue-50 text-blue-700",
    APPLICANT: "bg-gray-50 text-gray-600",
  };
  return map[role] || "bg-gray-50 text-gray-600";
};

export default function UsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeFilter !== "All") params.set("status", activeFilter.toUpperCase());
      params.set("page", String(page));
      params.set("pageSize", "20");

      const { data, error } = await api.get<UsersResponse>(`/api/admin/users?${params}`);
      if (error || !data) throw new Error(error || "No data");
      setData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => setPage(1), 400));
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setActionLoading(userId);
    setRoleDropdown(null);
    try {
      const { data, error } = await api.patch(`/api/admin/users/${userId}`, { role: newRole });
      if (error) throw new Error(error);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: string) {
    setActionLoading(userId);
    const newStatus = currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      const { data, error } = await api.patch(`/api/admin/users/${userId}`, { accountStatus: newStatus });
      if (error) throw new Error(error);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: string) {
    setActionLoading(userId);
    setDeleteConfirm(null);
    try {
      const { data, error } = await api.delete(`/api/admin/users/${userId}`);
      if (error) throw new Error(error);
      if (selectedUser?.id === userId) setSelectedUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusQuery(status: string) {
    if (status === "All") return "";
    return status.toLowerCase();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setPage(1); }}
              className={cn(
                "touch-target rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeFilter === f
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-muted">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted">KYC</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data && data.users.length > 0 ? (
                data.users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/users/${user.id}`}
                        className="touch-target flex items-center gap-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <span className="font-medium text-foreground hover:text-primary">
                          {user.firstName} {user.lastName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-muted">{user.email}</td>
                    <td className="px-4 py-3.5">
                      <div className="relative">
                        <button
                          onClick={() => setRoleDropdown(roleDropdown === user.id ? null : user.id)}
                          className="touch-target inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80"
                        >
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", roleBadge(user.role))}>
                            {user.role}
                          </span>
                          <ChevronDown size={12} className="text-muted" />
                        </button>
                        {roleDropdown === user.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setRoleDropdown(null)} />
                            <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-border bg-card py-1 shadow-lg">
                              {ROLES.map((r) => (
                                <button
                                  key={r}
                                  onClick={() => handleRoleChange(user.id, r)}
                                  disabled={actionLoading === user.id}
                                  className={cn(
                                    "touch-target flex w-full items-center px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50",
                                    user.role === r ? "text-primary" : "text-foreground",
                                    actionLoading === user.id && "opacity-50"
                                  )}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(user.accountStatus))}>
                        {user.accountStatus === "PENDING_APPROVAL" ? "Pending" : user.accountStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", kycBadge(user.kycStatus))}>
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="touch-target rounded-lg p-1.5 text-muted transition-colors hover:bg-gray-100 hover:text-foreground"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.accountStatus)}
                          disabled={actionLoading === user.id}
                          className={cn(
                            "touch-target rounded-lg p-1.5 transition-colors",
                            user.accountStatus === "SUSPENDED"
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-amber-600 hover:bg-amber-50",
                            actionLoading === user.id && "opacity-50"
                          )}
                          title={user.accountStatus === "SUSPENDED" ? "Activate" : "Suspend"}
                        >
                          {user.accountStatus === "SUSPENDED" ? <Shield size={16} /> : <ShieldOff size={16} />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="touch-target rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {deleteConfirm === user.id && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
                            <h3 className="text-base font-semibold text-foreground">Confirm Delete</h3>
                            <p className="mt-2 text-sm text-muted">
                              Are you sure you want to delete {user.firstName} {user.lastName}? This action cannot be undone.
                            </p>
                            <div className="mt-4 flex justify-end gap-3">
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                disabled={actionLoading === user.id}
                                className="touch-target rounded-lg bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted">
              Showing {((data.page - 1) * data.pageSize) + 1} &ndash; {Math.min(data.page * data.pageSize, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="touch-target rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.totalPages || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-xs text-muted">&hellip;</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={cn(
                        "touch-target min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                        page === p
                          ? "bg-primary text-white"
                          : "text-muted hover:bg-gray-50"
                      )}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="touch-target rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-base font-semibold text-foreground">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="touch-target rounded-lg p-1 text-muted hover:bg-gray-100 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-xs text-muted">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted">Role</p>
                  <span className={cn("mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", roleBadge(selectedUser.role))}>
                    {selectedUser.role}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted">Status</p>
                  <span className={cn("mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(selectedUser.accountStatus))}>
                    {selectedUser.accountStatus === "PENDING_APPROVAL" ? "Pending Approval" : selectedUser.accountStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted">KYC</p>
                  <span className={cn("mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", kycBadge(selectedUser.kycStatus))}>
                    {selectedUser.kycStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted">Phone</p>
                  <p className="text-sm text-foreground">{selectedUser.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Category</p>
                  <p className="text-sm text-foreground">{selectedUser.category || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Joined</p>
                  <p className="text-sm text-foreground">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Link
                  href={`/users/${selectedUser.id}`}
                  className="touch-target flex-1 rounded-lg bg-primary py-2 text-center text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Full Profile
                </Link>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
