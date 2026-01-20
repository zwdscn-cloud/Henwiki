"use client"

import { Suspense } from "react"
import { RolesContent } from "@/components/admin/roles-content"

export default function AdminRolesPage() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <RolesContent />
    </Suspense>
  )
}
