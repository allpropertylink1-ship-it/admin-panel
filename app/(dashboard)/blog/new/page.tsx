"use client"

import BlogNewEditForm from "@/components/blog/NewEditForm"
import { useRouter } from "next/navigation"

export default function BlogNewPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">New Post</h1>
        <p className="mt-1 text-sm text-muted">Create a new blog post</p>
      </div>
      <BlogNewEditForm
        isEdit={false}
        onSuccess={() => router.push("/dashboard/blog")}
      />
    </div>
  )
}