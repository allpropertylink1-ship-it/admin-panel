import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="mb-1 h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-28 rounded-lg" />
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border p-4">
              <div className="ml-auto">
                <Skeleton className="h-10 w-64 rounded-xl" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-gray-50/80">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <th key={i} className="px-4 py-3.5">
                        <Skeleton className="h-3 w-16" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, r) => (
                    <tr key={r} className="animate-pulse border-b border-border">
                      <td className="w-10 px-2 py-3"><Skeleton className="h-4 w-4 rounded" /></td>
                      {Array.from({ length: 6 }).map((_, c) => (
                        <td key={c} className="px-4 py-3">
                          <Skeleton className={`h-4 rounded ${c === 0 ? "w-48" : c === 1 ? "w-24" : c === 5 ? "w-20 ml-auto" : "w-20"}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
