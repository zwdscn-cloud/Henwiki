import { Suspense } from "react"
import { PapersContent } from "@/components/papers-content"
import { PageLayout } from "@/components/page-layout"

export default function PapersPage() {
  return (
    <PageLayout>
      <Suspense fallback={null}>
        <PapersContent />
      </Suspense>
    </PageLayout>
  )
}
