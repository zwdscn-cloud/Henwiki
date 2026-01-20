import { Suspense } from "react"
import { AdsContent } from "@/components/admin/ads-content"

export default function AdminAdsPage() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <AdsContent />
    </Suspense>
  )
}
