import { Suspense } from "react"
import { UsersContent } from "@/components/admin/users-content"

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <UsersContent />
    </Suspense>
  )
}
