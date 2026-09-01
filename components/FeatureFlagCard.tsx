"use client"

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Save, Trash2, Loader2 } from "@/components/ui/icons";
import { isValidEmail, type FeatureFlag } from "@/lib/feature-flags";

type Mode = "off" | "everyone" | "beta";

export interface FlagDraft {
  key: string;
  description: string;
  mode: Mode;
  allowListText: string;
}

export function modeOf(flag: { enabled: boolean; allowList: string[] | null }): Mode {
  if (!flag.enabled) return "off";
  return flag.allowList && flag.allowList.length > 0 ? "beta" : "everyone";
}

export function toList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((email) => email.toLowerCase());
}

export function draftFromFlag(flag: FeatureFlag): FlagDraft {
  return {
    key: flag.key,
    description: flag.description ?? "",
    mode: modeOf(flag),
    allowListText: (flag.allowList ?? []).join("\n"),
  };
}

export const emptyDraft: FlagDraft = { key: "", description: "", mode: "off", allowListText: "" };

export function validateDraft(draft: FlagDraft, existingKeys: string[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const key = draft.key.trim();
  if (!key) errors.key = "Key is required";
  else if (!/^[a-z0-9][a-z0-9_-]*$/.test(key) || key.length > 64)
    errors.key = "Lowercase letters, numbers, underscores, hyphens only (max 64 chars)";
  else if (existingKeys.includes(key)) errors.key = "A flag with this key already exists";
  const emails = toList(draft.allowListText);
  if (draft.mode === "beta" && emails.length === 0) errors.allowList = "Beta mode needs at least one email";
  const invalid = emails.filter((email) => !isValidEmail(email));
  if (invalid.length > 0) errors.allowList = `Invalid email(s): ${invalid.slice(0, 3).join(", ")}`;
  if (emails.length > 500) errors.allowList = "Maximum 500 emails";
  return errors;
}

const MODE_LABELS: Record<Mode, string> = { off: "Off", everyone: "Everyone", beta: "Beta" };
const MODE_HINTS: Record<Mode, string> = {
  off: "Hidden from all users",
  everyone: "Visible to everyone",
  beta: "Visible only to allowlisted emails",
};

interface ModeSelectProps {
  value: Mode;
  onChange: (mode: Mode) => void;
  disabled: boolean;
  error?: string;
}

function ModeSelect({ value, onChange, disabled, error }: ModeSelectProps) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(["off", "everyone", "beta"] as Mode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode)}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
              value === mode
                ? mode === "off"
                  ? "border-red-200 bg-error-50 text-red-700"
                  : mode === "beta"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-border bg-background text-muted hover:border-primary/40 hover:text-foreground"
            )}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">{MODE_HINTS[value]}</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface FeatureFlagCardProps {
  flag: FeatureFlag;
  draft: FlagDraft;
  onChange: (draft: FlagDraft) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
  error?: string;
}

export function FeatureFlagCard({
  flag,
  draft,
  onChange,
  onSave,
  onDelete,
  saving,
  deleting,
  error,
}: FeatureFlagCardProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    const errors = validateDraft(draft, []);
    setFieldErrors(errors);
    if (Object.keys(errors).length === 0) onSave();
  };

  const handleDelete = () => {
    setConfirmDelete(false);
    onDelete();
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <code className="rounded-lg bg-background px-2.5 py-1 text-sm font-semibold text-foreground">
            {flag.key}
          </code>
          {error ? (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              Error
            </span>
          ) : (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                draft.mode === "off"
                  ? "bg-error-50 text-red-700"
                  : draft.mode === "beta"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
              )}
            >
              {MODE_LABELS[draft.mode]}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
          className="rounded-xl border border-border px-3 py-1.5 text-sm font-medium text-red-600 transition-all hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete
        </button>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <label className="block text-sm font-medium text-foreground">Description</label>
          <input
            type="text"
            value={draft.description}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            placeholder="What does this flag control?"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
          />
        </div>
        <ModeSelect
          value={draft.mode}
          onChange={(mode) => onChange({ ...draft, mode })}
          disabled={saving}
        />
        {draft.mode === "beta" && (
          <div>
            <label className="block text-sm font-medium text-foreground">
              Allowlist <span className="text-muted">(one email per line)</span>
            </label>
            <textarea
              value={draft.allowListText}
              onChange={(e) => onChange({ ...draft, allowListText: e.target.value })}
              rows={4}
              disabled={saving}
              placeholder={"beta@example.com\nteam@example.com"}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all font-mono"
            />
            {fieldErrors.allowList && <p className="mt-1 text-xs text-red-600">{fieldErrors.allowList}</p>}
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-all disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Delete this flag?</h3>
            <p className="mt-2 text-sm text-muted">
              &quot;{flag.key}&quot; will be removed immediately. Features gated on
              it will fail closed (stay hidden) for all users.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="touch-target rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="touch-target rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
