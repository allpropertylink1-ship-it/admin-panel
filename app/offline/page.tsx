import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're offline",
  description: "You appear to be offline. Check your connection and try again.",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#286255]/10"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#286255"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 5-2.91" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">You&apos;re offline</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        It looks like you&apos;ve lost your internet connection. The admin dashboard needs a
        connection — check yours and try again.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#286255] px-6 py-2.5 text-sm font-medium text-white"
        >
          Try again
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground"
        >
          Go to dashboard
        </Link>
      </div>
      <p className="mt-6 text-xs text-muted">
        Your connection will be checked automatically when you retry.
      </p>
    </main>
  );
}
