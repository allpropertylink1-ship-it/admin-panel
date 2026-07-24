import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
            <Skeleton className="h-8 w-8 rounded-lg bg-accent/10" />
          </div>
          <Skeleton className="mx-auto mb-1 h-7 w-40" />
          <Skeleton className="mx-auto h-4 w-28" />
        </div>
        <div className="rounded-2xl border border-primary-700/50 bg-primary-800/50 p-8 backdrop-blur-sm">
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="mb-6 h-4 w-56" />
          <div className="space-y-5">
            <div>
              <Skeleton className="mb-1.5 h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="mb-1.5 h-4 w-36" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
