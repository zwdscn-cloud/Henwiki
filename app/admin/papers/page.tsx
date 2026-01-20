import { Suspense } from "react"
import { PapersContent } from "@/components/admin/papers-content"

export default function AdminPapersPage() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <PapersContent />
    </Suspense>
  )
}
