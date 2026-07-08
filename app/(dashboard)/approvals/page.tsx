"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  Globe,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface KycDocument {
  id: string;
  documentType: string;
  documentNumber?: string;
  status: string;
  frontImage?: string;
  backImage?: string;
}

interface PendingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  category?: string;
  specialties: string[];
  companyName?: string;
  contactPerson?: string;
  website?: string;
  location?: string;
  city?: string;
  estateSubLocation?: string;
  aplRepName?: string;
  aplRepPhone?: string;
  refereeName?: string;
  refereePhone?: string;
  refereeLocation?: string;
  createdAt: string;
  kycDocuments: KycDocument[];
}

const docTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    NATIONAL_ID: "National ID",
    PASSPORT: "Passport",
    KRA_PIN: "KRA PIN",
    BUSINESS_REG: "Business Registration",
    COMPANY_CR12: "Company CR12",
    CERTIFICATE_OF_INCORPORATION: "Certificate of Incorporation",
  };
  return map[type] || type;
};

export default function ApprovalsPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectInput, setRejectInput] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  async function fetchPendingUsers() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await api.get<{ users: PendingUser[] }>("/api/admin/users/pending");
      if (error) throw new Error(error);
      setUsers(data?.users ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId);
    try {
      const { data, error } = await api.post(`/api/admin/users/${userId}/approve`, {});
      if (error) throw new Error("Failed to approve user");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(userId: string) {
    if (!rejectReason.trim()) return;
    setActionLoading(userId);
    try {
      const { data, error } = await api.patch(`/api/admin/users/${userId}`, { accountStatus: "REJECTED", rejectionReason: rejectReason.trim() });
      if (error) throw new Error("Failed to reject user");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setRejectInput(null);
      setRejectReason("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
          <p className="mt-1 text-sm text-muted">
            {users.length} user{users.length !== 1 ? "s" : ""} awaiting approval
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {users.length > 0 && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <label htmlFor="search-approvals" className="sr-only">Search pending users</label>
          <input
            id="search-approvals"
            type="text"
            placeholder="Search pending users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
              <div className="mb-3 h-5 w-48 rounded bg-gray-200" />
              <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
              <div className="h-4 w-64 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          {search ? (
            <>
              <Search size={40} className="mb-3 text-muted" />
              <h3 className="text-base font-semibold text-foreground">No results</h3>
              <p className="mt-1 text-sm text-muted">No users match your search</p>
            </>
          ) : (
            <>
              <CheckCircle size={40} className="mb-3 text-emerald-400" />
              <h3 className="text-base font-semibold text-foreground">All caught up</h3>
              <p className="mt-1 text-sm text-muted">No pending approvals at this time</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((user) => {
            const isExpanded = expanded === user.id;
            return (
              <div
                key={user.id}
                className="rounded-xl border border-border bg-card transition-shadow hover:shadow-sm"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : user.id)}
                  className="touch-target flex w-full items-center gap-4 px-6 py-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-semibold text-amber-700">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    {user.category && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {user.category}
                      </span>
                    )}
                    {user.specialties.length > 0 && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {user.specialties[0]}
                        {user.specialties.length > 1 && ` +${user.specialties.length - 1}`}
                      </span>
                    )}
                  </div>
                  <div className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Pending
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="shrink-0 text-muted" /> : <ChevronDown size={18} className="shrink-0 text-muted" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-6 py-5">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-5">
                        <div>
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Contact & Company</h4>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Detail icon={Mail} label="Email" value={user.email} />
                            <Detail icon={Phone} label="Phone" value={user.phone || "—"} />
                            <Detail icon={Building2} label="Company" value={user.companyName || "—"} />
                            <Detail icon={User} label="Contact Person" value={user.contactPerson || "—"} />
                            <Detail icon={Globe} label="Website" value={user.website || "—"} />
                            <Detail icon={MapPin} label="Sub-location" value={user.estateSubLocation || "—"} />
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Location & Category</h4>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Detail icon={MapPin} label="Location" value={user.location || user.city || "—"} />
                            <Detail icon={Building2} label="Category" value={user.category || "—"} />
                          </div>
                          {user.specialties.length > 0 && (
                            <div className="mt-3">
                              <p className="mb-1.5 text-xs text-muted">Specialties</p>
                              <div className="flex flex-wrap gap-1.5">
                                {user.specialties.map((s) => (
                                  <span key={s} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Referee & APL Rep</h4>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="mb-1 text-xs font-medium text-foreground">Referee</p>
                              <p className="text-sm text-foreground">{user.refereeName || "—"}</p>
                              <p className="text-xs text-muted">{user.refereePhone || ""}</p>
                              <p className="text-xs text-muted">{user.refereeLocation || ""}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="mb-1 text-xs font-medium text-foreground">APL Representative</p>
                              <p className="text-sm text-foreground">{user.aplRepName || "—"}</p>
                              <p className="text-xs text-muted">{user.aplRepPhone || ""}</p>
                            </div>
                          </div>
                        </div>

                        {user.kycDocuments.length > 0 && (
                          <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Documents</h4>
                            <div className="divide-y divide-border rounded-lg border border-border">
                              {user.kycDocuments.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <FileText size={16} className="text-muted" />
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{docTypeLabel(doc.documentType)}</p>
                                      {doc.documentNumber && (
                                        <p className="text-xs text-muted">{doc.documentNumber}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                      {doc.status}
                                    </span>
                                    {(doc.frontImage || doc.backImage) && (
                                      <div className="flex gap-1">
                                        {doc.frontImage && (
                                          <a
                                            href={doc.frontImage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="touch-target inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted transition-colors hover:bg-gray-50"
                                          >
                                            View <ExternalLink size={10} />
                                          </a>
                                        )}
                                        {doc.backImage && (
                                          <a
                                            href={doc.backImage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="touch-target inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted transition-colors hover:bg-gray-50"
                                          >
                                            Back <ExternalLink size={10} />
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 lg:items-start">
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={actionLoading === user.id}
                          className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 lg:w-auto"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          {actionLoading === user.id ? "Approving..." : "Approve User"}
                        </button>

                        {rejectInput === user.id ? (
                          <div className="w-full space-y-2">
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection..."
                              rows={3}
                              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(user.id)}
                                disabled={actionLoading === user.id || !rejectReason.trim()}
                                className="touch-target inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <XCircle size={14} />
                                )}
                                {actionLoading === user.id ? "Rejecting..." : "Confirm Reject"}
                              </button>
                              <button
                                onClick={() => { setRejectInput(null); setRejectReason(""); }}
                                className="touch-target rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectInput(user.id)}
                            className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 lg:w-auto"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        )}

                        <Link
                          href={`/users/${user.id}`}
                          className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 lg:w-auto"
                        >
                          <ExternalLink size={16} />
                          Full Profile
                        </Link>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-muted">
                      Registered {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}
