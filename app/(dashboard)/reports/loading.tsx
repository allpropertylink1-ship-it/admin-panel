import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="mb-1 h-8 w-32" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="mt-4 h-7 w-16 rounded" />
                <Skeleton className="mt-2 h-4 w-24 rounded" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card lg:col-span-2">
              <div className="border-b border-border px-5 py-4">
                <Skeleton className="h-5 w-52 rounded" />
              </div>
              <div className="p-5">
                <div className="flex items-end gap-2 h-40">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-1 rounded bg-gray-200 animate-pulse" style={{ height: `${20 + Math.random() * 80}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                  <Skeleton className="h-4 w-28 rounded" />
                </div>
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 flex-1 rounded" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                  <Skeleton className="h-4 w-36 rounded" />
                </div>
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-24 rounded" />
                        <Skeleton className="h-3 w-32 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
