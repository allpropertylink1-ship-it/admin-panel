import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 sm:p-5">
                <div className="mb-3 h-10 w-10 rounded-xl bg-gray-200" />
                <div className="mb-1.5 h-3 w-20 rounded bg-gray-200 sm:h-3.5 sm:w-24" />
                <div className="h-6 w-14 rounded bg-gray-200 sm:h-7 sm:w-16" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
                <div className="mb-4 h-5 w-40 rounded bg-gray-200" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="mb-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="mb-1 h-3.5 w-32 rounded bg-gray-200" />
                      <div className="h-3 w-24 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
