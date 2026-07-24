"use client"
import { cn } from "@/lib/utils"

interface ColumnDef { width: string }

interface TableSkeletonProps {
  rows?: number
  columns: ColumnDef[]
  checkbox?: boolean
}

export function TableSkeleton({ rows = 6, columns, checkbox = true }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-border">
          {checkbox && <td className="w-10 px-2 py-3"><div className="h-4 w-4 rounded bg-gray-200" /></td>}
          {columns.map((col, j) => (
            <td key={j} className="px-4 py-3">
              <div className={cn("h-4 rounded bg-gray-200", col.width)} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}