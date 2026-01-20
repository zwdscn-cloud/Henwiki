import { Suspense } from "react"
import { TermsContent } from "@/components/admin/terms-content"

export default function AdminTermsPage() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <TermsContent />
    </Suspense>
  )
}
