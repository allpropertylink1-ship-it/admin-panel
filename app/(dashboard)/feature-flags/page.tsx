"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Plus, Loader2, CheckCircle2, AlertCircle } from "@/components/ui/icons";
import {
  FeatureFlagCard,
  draftFromFlag,
  emptyDraft,
  validateDraft,
  type FlagDraft,
} from "@/components/FeatureFlagCard";
import type { FeatureFlag } from "@/lib/feature-flags";

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, FlagDraft>>({});
  const [newDraft, setNewDraft] = useState<FlagDraft>(emptyDraft);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newFieldErrors, setNewFieldErrors] = useState<Record<string, string>>({});

  const fetchFlags = useCallback(async () => {
    try {
      const { data, error } = await api.get<{ data: FeatureFlag[] }>(
        "/api/admin/feature-flags"
      );
      if (!error && data?.data) {
        setFlags(data.data);
        setDrafts((prev) => {
          const next: Record<string, FlagDraft> = {};
          for (const flag of data.data) {
            next[flag.key] = prev[flag.key] ?? draftFromFlag(flag);
          }
          return next;
        });
      } else if (error) {
        setMessage({ type: "error", text: error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load feature flags." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  async function saveFlag(draft: FlagDraft) {
    setSavingKey(draft.key.trim());
    setMessage(null);
    const emails = draft.allowListText
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      const { data, error } = await api.post<{ success: boolean }>(
        "/api/admin/feature-flags",
        {
          key: draft.key.trim(),
          enabled: draft.mode !== "off",
          allowList: draft.mode === "beta" ? emails : null,
          description: draft.description.trim() || null,
        }
      );
      if (!error && data?.success) {
        setMessage({
          type: "success",
          text: `Flag "${draft.key.trim()}" updated.`,
        });
        await fetchFlags();
      } else {
        setMessage({ type: "error", text: error || "Failed to save flag." });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSavingKey(null);
    }
  }

  async function createFlag(draft: FlagDraft) {
    const errors = validateDraft(draft, flags.map((f) => f.key));
    setNewFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingKey("__new__");
    setMessage(null);
    const emails = draft.allowListText
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      const { data, error } = await api.post<{ success: boolean }>(
        "/api/admin/feature-flags",
        {
          key: draft.key.trim(),
          enabled: draft.mode !== "off",
          allowList: draft.mode === "beta" ? emails : null,
          description: draft.description.trim() || null,
        }
      );
      if (!error && data?.success) {
        setMessage({ type: "success", text: `Flag "${draft.key.trim()}" created.` });
        setNewDraft(emptyDraft);
        setShowCreate(false);
        await fetchFlags();
      } else {
        setMessage({ type: "error", text: error || "Failed to create flag." });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSavingKey(null);
    }
  }

  async function deleteFlag(key: string) {
    setDeletingKey(key);
    setMessage(null);
    try {
      const { data, error } = await api.delete<{ success: boolean }>(
        `/api/admin/feature-flags/${encodeURIComponent(key)}`
      );
      if (!error && data?.success) {
        setMessage({ type: "success", text: `Flag "${key}" deleted.` });
        await fetchFlags();
      } else {
        setMessage({ type: "error", text: error || "Failed to delete flag." });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feature Flags</h1>
          <p className="mt-1 text-sm text-muted">
            Gate new features: Off hides them, Everyone ships them, Beta shows
            them only to allowlisted emails. Changes take effect within ~30
            seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all inline-flex items-center gap-2"
        >
          <Plus size={16} />
          New Flag
        </button>
      </div>

      {message && (
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm",
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-100 bg-error-50 text-red-700"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <AlertCircle size={18} className="text-red-500" />
          )}
          {message.text}
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-dashed border-primary/40 bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">New Feature Flag</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Key <span className="text-muted">(lowercase, no spaces)</span>
              </label>
              <input
                type="text"
                value={newDraft.key}
                onChange={(e) => setNewDraft({ ...newDraft, key: e.target.value })}
                placeholder="e.g. payments"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all font-mono"
              />
              {newFieldErrors.key && (
                <p className="mt-1 text-xs text-red-600">{newFieldErrors.key}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Description</label>
              <input
                type="text"
                value={newDraft.description}
                onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })}
                placeholder="What does this flag control?"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              />
            </div>
            {newFieldErrors.allowList && (
              <p className="text-xs text-red-600">{newFieldErrors.allowList}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewFieldErrors({});
                }}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingKey === "__new__"}
                onClick={() => createFlag(newDraft)}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2"
              >
                {savingKey === "__new__" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {savingKey === "__new__" ? "Creating..." : "Create Flag"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-primary" />
          <p className="text-sm text-muted">Loading feature flags...</p>
        </div>
      ) : flags.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted">
            No feature flags yet. Click “New Flag” to create the first one.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {flags.map((flag) => (
            <FeatureFlagCard
              key={flag.key}
              flag={flag}
              draft={drafts[flag.key] ?? draftFromFlag(flag)}
              onChange={(draft) =>
                setDrafts((prev) => ({ ...prev, [flag.key]: draft }))
              }
              onSave={() => saveFlag(drafts[flag.key] ?? draftFromFlag(flag))}
              onDelete={() => deleteFlag(flag.key)}
              saving={savingKey === flag.key}
              deleting={deletingKey === flag.key}
            />
          ))}
        </div>
      )}
    </div>
  );
}
