"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  ShieldOff,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  User,
  BadgeCheck,
  FileText,
  Clock,
  ChevronRight,
} from "@/components/ui/icons";

interface KycDocument {
  id: string;
  documentType: string;
  documentNumber?: string;
  status: string;
  frontImage?: string;
  backImage?: string;
  bioData?: { firstName?: string; middleName?: string; lastName?: string; phone?: string; email?: string } | null;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  accountStatus: string;
  kycStatus: string;
  userTypes?: string[];
  primaryUserType?: string;
  category?: string;
  specialties: string[];
  companyName?: string;
  contactPerson?: string;
  website?: string;
  location?: string;
  city?: string;
  address?: string;
  estateSubLocation?: string;

  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  lastLogin?: string;
  kycDocuments: KycDocument[];
  auditLogs: AuditLogEntry[];
  properties?: {
    id: string; slug: string; title: string; price: number
    propertyType: string; listingPurpose: string | null
    moderationStatus: string; city: string | null; createdAt: string
    images: unknown
  }[];
  serviceListings?: {
    id: string; title: string; price: number | null
    moderationStatus: string; city: string | null; createdAt: string
    images: unknown
  }[];
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200",
    SUSPENDED: "bg-red-50 text-red-700 border-red-200",
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return map[status] || "bg-gray-50 text-gray-600 border-gray-200";
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

const docTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    NATIONAL_ID: "National ID",
    PASSPORT: "Passport",
    DRIVERS_LICENSE: "Driver's License",
  };
  return map[type] || type;
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      try {
        const { data, error } = await api.get<{ user: UserDetail }>(`/api/admin/users/${params.id}`);
        if (error || !data) throw new Error(error || "No data");
        setUser(data.user || data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id]);

  async function handleAction(action: string) {
    if (!user) return;
    setActionLoading(action);
    try {
      if (action === "delete") {
        const { data, error } = await api.delete(`/api/admin/users/${user.id}`);
        if (error) throw new Error(error);
        router.push("/users");
        return;
      }
      const { data, error } = await api.patch<{ user: UserDetail }>(`/api/admin/users/${user.id}`, {
        accountStatus: action === "approve" ? "APPROVED" : "SUSPENDED",
      });
      if (error || !data) throw new Error(error || "No data");
      setUser(data.user || data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 h-16 w-16 rounded-full bg-gray-200" />
            <div className="mb-2 h-6 w-48 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="mb-4 text-error" />
        <h3 className="text-lg font-semibold text-foreground">Failed to load user</h3>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <button
          onClick={() => router.back()}
          className="touch-target mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!user) return null;

  const isPending = user.accountStatus === "PENDING_APPROVAL";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="touch-target rounded-lg border border-border p-2 text-muted transition-colors hover:bg-gray-50 hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-muted">User profile</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-600">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{user.firstName} {user.lastName}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge(user.accountStatus))}>
                        {user.accountStatus}
                      </span>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", kycBadge(user.kycStatus))}>
                        KYC: {user.kycStatus}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isPending && (
                      <button
                        onClick={() => handleAction("approve")}
                        disabled={actionLoading === "approve"}
                        className="touch-target inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                        {actionLoading === "approve" ? "Approving..." : "Approve"}
                      </button>
                    )}
                    <button
                      onClick={() => handleAction("suspend")}
                      disabled={actionLoading === "suspend"}
                      className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                    >
                      <ShieldOff size={16} />
                      {actionLoading === "suspend" ? "Suspending..." : "Suspend"}
                    </button>
                    <button
                      onClick={() => handleAction("delete")}
                      disabled={actionLoading === "delete"}
                      className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {actionLoading === "delete" ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">Personal Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Phone} label="Phone" value={user.phone || "—"} />
              <InfoRow icon={User} label="User Type" value={user.userTypes?.join(", ") || user.primaryUserType || "—"} />
              <InfoRow icon={MapPin} label="Address" value={user.address || "—"} />
              <InfoRow icon={MapPin} label="City" value={user.city || "—"} />
              <InfoRow icon={Building2} label="Category" value={user.category || "—"} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">Professional Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={Building2} label="Company" value={user.companyName || "—"} />
              <InfoRow icon={User} label="Contact Person" value={user.contactPerson || "—"} />
              <InfoRow icon={Globe} label="Website" value={user.website || "—"} />
              <InfoRow icon={MapPin} label="Sub-location" value={user.estateSubLocation || "—"} />
              <div className="sm:col-span-2">
                <p className="text-xs text-muted">Specialties</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {user.specialties.length > 0
                    ? user.specialties.map((s) => (
                        <span key={s} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          {s}
                        </span>
                      ))
                    : <span className="text-sm text-foreground">—</span>}
                </div>
              </div>
            </div>
          </div>

          {user.kycDocuments.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Documents</h3>
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
                        {doc.bioData && (
                          <p className="text-[11px] text-muted">
                            {doc.bioData.firstName} {doc.bioData.middleName} {doc.bioData.lastName}
                            {doc.bioData.phone && <> · {doc.bioData.phone}</>}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", kycBadge(doc.status))}>
                        {doc.status}
                      </span>
                      {(doc.frontImage || doc.backImage) && (
                        <div className="flex gap-1.5">
                          {doc.frontImage && (
                            doc.frontImage.match(/\.pdf/i) ? (
                              <a href={doc.frontImage} target="_blank" rel="noopener noreferrer"
                                className="flex h-8 w-12 items-center justify-center rounded border border-border bg-red-50 text-red-400 transition-colors hover:bg-red-100"
                                title="View PDF"
                              >
                                <FileText size={14} />
                              </a>
                            ) : (
                              <a href={doc.frontImage} target="_blank" rel="noopener noreferrer">
                                <img src={doc.frontImage} alt="Front"
                                  className="h-8 w-12 rounded border border-border object-cover hover:ring-2 hover:ring-primary/50 transition-all"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                />
                              </a>
                            )
                          )}
                          {doc.backImage && (
                            doc.backImage.match(/\.pdf/i) ? (
                              <a href={doc.backImage} target="_blank" rel="noopener noreferrer"
                                className="flex h-8 w-12 items-center justify-center rounded border border-border bg-red-50 text-red-400 transition-colors hover:bg-red-100"
                                title="View PDF"
                              >
                                <FileText size={14} />
                              </a>
                            ) : (
                              <a href={doc.backImage} target="_blank" rel="noopener noreferrer">
                                <img src={doc.backImage} alt="Back"
                                  className="h-8 w-12 rounded border border-border object-cover hover:ring-2 hover:ring-primary/50 transition-all"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                />
                              </a>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.properties && user.properties.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Properties ({user.properties.length})</h3>
              <div className="divide-y divide-border rounded-lg border border-border">
                {user.properties.map((prop) => (
                  <div key={prop.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{prop.title}</p>
                      <p className="text-xs text-muted">
                        {prop.propertyType} · KES {Number(prop.price).toLocaleString()}
                        {prop.listingPurpose && (
                          <span className="ml-1.5 text-primary">· {prop.listingPurpose === "FOR_RENT_SHORT_TERM" ? "Airbnb" : prop.listingPurpose === "FOR_RENT_LONG_TERM" ? "Rent" : "Sale"}</span>
                        )}
                        {prop.city && <span className="ml-1.5">· {prop.city}</span>}
                      </p>
                    </div>
                    <span className={cn("ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", {
                      "bg-emerald-50 text-emerald-700": prop.moderationStatus === "APPROVED",
                      "bg-amber-50 text-amber-700": prop.moderationStatus === "PENDING_REVIEW",
                      "bg-red-50 text-red-700": prop.moderationStatus === "REJECTED",
                      "bg-gray-50 text-gray-600": prop.moderationStatus === "DRAFT",
                    })}>
                      {prop.moderationStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.serviceListings && user.serviceListings.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Services ({user.serviceListings.length})</h3>
              <div className="divide-y divide-border rounded-lg border border-border">
                {user.serviceListings.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{svc.title}</p>
                      <p className="text-xs text-muted">
                        {svc.price ? `KES ${Number(svc.price).toLocaleString()}` : "Price not set"}
                        {svc.city && <span className="ml-1.5">· {svc.city}</span>}
                      </p>
                    </div>
                    <span className={cn("ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", {
                      "bg-emerald-50 text-emerald-700": svc.moderationStatus === "APPROVED",
                      "bg-amber-50 text-amber-700": svc.moderationStatus === "PENDING_REVIEW",
                      "bg-red-50 text-red-700": svc.moderationStatus === "REJECTED",
                      "bg-gray-50 text-gray-600": svc.moderationStatus === "DRAFT",
                    })}>
                      {svc.moderationStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">Account Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Member since</span>
                <span className="text-xs font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Last updated</span>
                <span className="text-xs font-medium text-foreground">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {user.lastLogin && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Last login</span>
                  <span className="text-xs font-medium text-foreground">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </span>
                </div>
              )}
              {user.approvedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Approved</span>
                  <span className="text-xs font-medium text-emerald-600">
                    {new Date(user.approvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {user.auditLogs && user.auditLogs.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Activity Timeline</h3>
              <div className="space-y-0">
                {user.auditLogs.map((log, i) => (
                  <div key={log.id} className="relative flex gap-4 pb-4 last:pb-0">
                    {i < user.auditLogs.length - 1 && (
                      <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
                    )}
                    <div className="flex h-[15px] w-[15px] shrink-0 items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {log.action}
                      </p>
                      <p className="text-xs text-muted">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"} &middot;{" "}
                        {new Date(log.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}
