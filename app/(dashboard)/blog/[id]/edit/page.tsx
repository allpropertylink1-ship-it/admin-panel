"use client"

import BlogNewEditForm from "@/components/blog/NewEditForm"
import { useRouter } from "next/navigation"

interface EditPageProps {
  params: { id: string }
}

export default function BlogEditPage({ params }: EditPageProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Edit Post</h1>
          <p className="mt-1 text-sm text-muted">Modify an existing post</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/blog")}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Back to list
          </button>
        </div>
      </div>
      <BlogNewEditForm
        isEdit={true}
        postId={params.id}
        onSuccess={() => router.push("/dashboard/blog")}
      />
    </div>
  )
}
