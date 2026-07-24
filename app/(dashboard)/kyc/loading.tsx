import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex h-[calc(100vh-5rem)] gap-0">
          <div className="flex w-[420px] flex-shrink-0 flex-col border-r border-border bg-card">
            <div className="border-b border-border px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Skeleton className="mb-1 h-6 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-7 w-20 rounded-xl" />
              </div>
              <Skeleton className="mb-3 h-10 w-full rounded-xl" />
              <div className="rounded-xl border border-border bg-card p-1">
                <Skeleton className="h-7 w-full rounded-lg" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-b border-border px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28 rounded" />
                        <Skeleton className="h-3 w-36 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <Skeleton className="h-9 w-14 rounded" />
                    <Skeleton className="h-9 w-14 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center bg-background">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <Skeleton className="h-7 w-7 rounded" />
              </div>
              <Skeleton className="mx-auto mb-1 h-4 w-48" />
              <Skeleton className="mx-auto h-3 w-64" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
