import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <Skeleton className="mb-1 h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <div className="space-y-5 p-5">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j}>
                    <Skeleton className="mb-1.5 h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
