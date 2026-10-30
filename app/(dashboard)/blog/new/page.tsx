import BlogNewEditForm from "@/components/blog/NewEditForm"

export default function BlogNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">New Post</h1>
        <p className="mt-1 text-sm text-muted">Create a new blog post</p>
      </div>
      <BlogNewEditForm
        isEdit={false}
        onSuccess={() => window.location.href = "/dashboard/blog"}
      />
    </div>
  )
}
