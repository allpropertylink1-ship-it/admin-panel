import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <Skeleton className="mb-1 h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Skeleton className="mb-1 h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                  <div>
                    <Skeleton className="mb-1 h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </div>
                <div>
                  <Skeleton className="mb-3 h-4 w-28" />
                  <div className="space-y-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-gray-50/50 px-4 py-2.5">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-8" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Skeleton className="h-10 w-24 rounded-xl" />
                  <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
