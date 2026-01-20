"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Tag, ChevronRight, TrendingUp, Users, Loader2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TermCard } from "@/components/term-card"
import { apiGet } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"

export default function TagPage() {
  const params = useParams()
  const tag = params.tag as string
  const decodedTag = decodeURIComponent(tag)
  const [taggedTerms, setTaggedTerms] = useState<any[]>([])
  const [relatedTags, setRelatedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTerms()
  }, [decodedTag])

  const fetchTerms = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<{ terms: any[] }>(`/terms?tag=${encodeURIComponent(decodedTag)}&status=published&pageSize=50`)
      if (response.data) {
        const terms = response.data.terms.map(transformTerm)
        setTaggedTerms(terms)

        // 提取相关标签（从词条标签中获取）
        const allTags = new Set<string>()
        terms.forEach((term) => {
          term.tags?.forEach((t: string) => {
            if (t.toLowerCase() !== decodedTag.toLowerCase()) {
              allTags.add(t)
            }
          })
        })
        setRelatedTags(Array.from(allTags).slice(0, 5))
      }
    } catch (err) {
      console.error("Fetch tagged terms error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            首页
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">#{decodedTag}</span>
        </nav>

        {/* Tag Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">#{decodedTag}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {taggedTerms.length} 相关词条
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      1.2万 关注
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button>关注话题</Button>
          </div>
        </div>

        {/* Related Tags */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold text-sm text-foreground mb-3">相关标签</h3>
          <div className="flex flex-wrap gap-2">
            {relatedTags.length > 0 ? (
              relatedTags.map((t) => (
                <Link key={t} href={`/tag/${encodeURIComponent(t)}`}>
                  <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground cursor-pointer">
                    #{t}
                  </Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">暂无相关标签</p>
            )}
          </div>
        </div>

        {/* Tagged Terms */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {taggedTerms.length > 0 ? (
              taggedTerms.map((term) => <TermCard key={term.id} term={term} />)
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无相关词条</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
