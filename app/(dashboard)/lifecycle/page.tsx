"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { ExportButton } from "@/components/shared/ExportButton";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import {
  Clock,
  Sparkles,
  FileText,
  BadgeCheck,
  Archive,
  ImageIcon,
  Building2,
} from "@/components/ui/icons";

type ExpiringRow = {
  id: string;
  title: string;
  city: string;
  expiresAt: string | null;
};

type FeaturedRow = {
  id: string;
  title: string;
  city: string;
  featuredUntil: string | null;
};

type SeoRow = {
  id: string;
  title: string;
  city: string;
  seoTitle: string | null;
};

type ClaimedRow = {
  id: string;
  title: string;
  city: string;
  claimedAt: string | null;
};

type DiskUsage = { ok: true; files: number; bytes: number; truncated: boolean } | { ok: false };

interface LifecycleOverview {
  expiringSoon: ExpiringRow[];
  featuredExpiring: FeaturedRow[];
  seoPending: { count: number; sample: SeoRow[] };
  claimedProperties: { count: number; sample: ClaimedRow[] };
  purgedSlugCount: number;
  pdfFiles: { count: number; totalBytes: number; truncated: boolean };
  uploadsDiskUsage: DiskUsage;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function CardShell({ title, subtitle, count, icon: Icon, children }: {
  title: string;
  subtitle: string;
  count: number | string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {typeof count === "number" ? count.toLocaleString() : count}
        </span>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-5 py-8 text-center text-sm text-muted">{text}</p>;
}

export default function LifecyclePage() {
  const [data, setData] = useState<LifecycleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await api.get<LifecycleOverview>("/api/admin/lifecycle/overview");
      if (error || !data) throw new Error(error || "No data");
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lifecycle data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await fetchOverview(); })();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lifecycle</h1>
            <p className="mt-1 text-sm text-muted">Expiry, SEO, claims, storage and purge views.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-4 h-7 w-16 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                <TableSkeleton rows={6} columns={[{ width: "w-40" }, { width: "w-24" }, { width: "w-28" }]} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-error-50 px-4 py-3 text-sm text-red-700">
          <span className="text-red-500">●</span>
          {error || "Failed to load lifecycle data."}
        </div>
        <button
          onClick={fetchOverview}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  const disk = data.uploadsDiskUsage;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lifecycle</h1>
          <p className="mt-1 text-sm text-muted">
            Expiry, featured, SEO, claims, purge and storage views. Read-only.
          </p>
        </div>
        <ExportButton exportPath="/api/admin/exports/audit" filename="lifecycle.csv" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Expiring soon (14d)", value: data.expiringSoon.length },
          { label: "Featured expiring (14d)", value: data.featuredExpiring.length },
          { label: "SEO pending", value: data.seoPending.count },
          { label: "Claimed properties", value: data.claimedProperties.count },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="mt-1 text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CardShell
          title="Expiring soon"
          subtitle="Properties expiring within 14 days"
          count={data.expiringSoon.length}
          icon={Clock}
        >
          {data.expiringSoon.length === 0 ? (
            <EmptyState text="No properties expiring in the next 14 days." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.expiringSoon.map((p) => (
                    <tr key={p.id}>
                      <td className="max-w-55 truncate px-5 py-3 font-medium text-foreground">{p.title}</td>
                      <td className="px-4 py-3 text-muted">{p.city}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(p.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardShell>

        <CardShell
          title="Featured expiring"
          subtitle="Featured flags ending within 14 days"
          count={data.featuredExpiring.length}
          icon={Sparkles}
        >
          {data.featuredExpiring.length === 0 ? (
            <EmptyState text="No featured flags expiring in the next 14 days." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Featured until</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.featuredExpiring.map((p) => (
                    <tr key={p.id}>
                      <td className="max-w-55 truncate px-5 py-3 font-medium text-foreground">{p.title}</td>
                      <td className="px-4 py-3 text-muted">{p.city}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(p.featuredUntil)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardShell>

        <CardShell
          title="SEO pending"
          subtitle="Suggested SEO titles awaiting acceptance"
          count={data.seoPending.count}
          icon={FileText}
        >
          {data.seoPending.sample.length === 0 ? (
            <EmptyState text="No pending SEO suggestions." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Suggested SEO title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.seoPending.sample.map((p) => (
                    <tr key={p.id}>
                      <td className="max-w-55 truncate px-5 py-3 font-medium text-foreground">{p.title}</td>
                      <td className="max-w-55 truncate px-4 py-3 text-muted">{p.seoTitle ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardShell>

        <CardShell
          title="Claimed properties"
          subtitle="Properties with an active ownership claim"
          count={data.claimedProperties.count}
          icon={BadgeCheck}
        >
          {data.claimedProperties.sample.length === 0 ? (
            <EmptyState text="No claimed properties." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Claimed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.claimedProperties.sample.map((p) => (
                    <tr key={p.id}>
                      <td className="max-w-55 truncate px-5 py-3 font-medium text-foreground">{p.title}</td>
                      <td className="px-4 py-3 text-muted">{p.city}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(p.claimedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardShell>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <CardShell
          title="Purged slugs"
          subtitle="Permanently reserved slugs"
          count={data.purgedSlugCount}
          icon={Archive}
        >
          <div className="flex items-center gap-3 p-5">
            <Building2 size={20} className="shrink-0 text-muted" />
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">{data.purgedSlugCount.toLocaleString()}</span> slugs reserved, never reused.
            </p>
          </div>
        </CardShell>

        <CardShell
          title="PDF files"
          subtitle={data.pdfFiles.truncated ? "Capped at 500 rows" : "Stored PDF blobs"}
          count={data.pdfFiles.count}
          icon={FileText}
        >
          <div className="space-y-1 p-5 text-sm">
            <p className="text-muted">Files: <span className="font-semibold text-foreground">{data.pdfFiles.count.toLocaleString()}</span></p>
            <p className="text-muted">Total size: <span className="font-semibold text-foreground">{formatBytes(data.pdfFiles.totalBytes)}</span></p>
          </div>
        </CardShell>

        <CardShell
          title="Uploads disk usage"
          subtitle="On-disk uploads directory"
          count={disk.ok ? formatBytes(disk.bytes) : "Unavailable"}
          icon={ImageIcon}
        >
          <div className="space-y-1 p-5 text-sm">
            {disk.ok ? (
              <>
                <p className="text-muted">Files scanned: <span className="font-semibold text-foreground">{disk.files.toLocaleString()}</span></p>
                <p className="text-muted">Disk used: <span className="font-semibold text-foreground">{formatBytes(disk.bytes)}</span></p>
                {disk.truncated && <p className="text-xs text-muted">Capped at 2,000 files.</p>}
              </>
            ) : (
              <p className="text-muted">Uploads directory is not available on this host.</p>
            )}
          </div>
        </CardShell>
      </div>
    </div>
  );
}
