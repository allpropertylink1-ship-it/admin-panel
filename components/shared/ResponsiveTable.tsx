"use client"

import { cn } from "@/lib/utils"

interface ColumnDef {
  key: string
  header: string
  render: (row: unknown, index: number) => React.ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: ColumnDef[]
  keyExtractor: (row: T) => string
  rowClassName?: string | ((row: T) => string)
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  cardRender?: (row: T, index: number) => React.ReactNode
  loading?: boolean
  skeletonRows?: number
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  rowClassName,
  emptyMessage = "No data found",
  emptyIcon,
  cardRender,
  loading = false,
  skeletonRows = 5,
}: ResponsiveTableProps<T>) {
  const visibleColumns = columns.filter((col) => !col.hideOnMobile)

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-border bg-gray-50/80">
              {visibleColumns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className="animate-pulse border-b border-border">
                {visibleColumns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        {emptyIcon && <div className="mb-3 opacity-30">{emptyIcon}</div>}
        <p className="text-sm font-medium text-foreground/60">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-border bg-gray-50/80">
              {visibleColumns.map((col) => (
                <th key={col.key} className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, index) => (
              <tr key={keyExtractor(row)} className={cn("transition-colors hover:bg-gray-50/40", typeof rowClassName === "function" ? rowClassName(row) : rowClassName)}>
                {visibleColumns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 p-4">
        {data.map((row, index) => (
          <div
            key={keyExtractor(row)}
            className={cn(
              "rounded-xl border border-border bg-card shadow-sm p-4 transition-colors",
              typeof rowClassName === "function" ? rowClassName(row) : rowClassName
            )}
          >
            {cardRender ? (
              cardRender(row, index)
            ) : (
              <dl className="space-y-2">
                {visibleColumns.map((col) => (
                  <div key={col.key} className="flex items-start gap-3">
                    <dt className="flex-shrink-0 w-24 text-xs font-semibold uppercase tracking-wider text-muted">
                      {col.header}
                    </dt>
                    <dd className="flex-1 text-sm text-foreground min-w-0">
                      {col.render(row, index)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}