import { Suspense } from "react"
import { CommentsContent } from "@/components/admin/comments-content"

export default function AdminCommentsPage() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <CommentsContent />
    </Suspense>
  )
}
