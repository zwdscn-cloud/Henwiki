"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Hash, ChevronRight, TrendingUp, Users, MessageCircle, Loader2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { TermCard } from "@/components/term-card"
import { apiGet } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"

export default function TopicPage() {
  const params = useParams()
  const id = params.id as string
  const [relatedTerms, setRelatedTerms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 话题可以映射到标签
  const topicMap: Record<string, string> = {
    "1": "AGI",
    "2": "量子霸权",
    "3": "脑机接口",
  }

  const topicTitle = topicMap[id] || "话题"
  const topic = {
    title: topicTitle,
    description: `${topicTitle}相关的前沿科技讨论`,
  }

  useEffect(() => {
    fetchTerms()
  }, [id])

  const fetchTerms = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<{ terms: any[] }>(
        `/terms?tag=${encodeURIComponent(topicTitle)}&status=published&pageSize=10`
      )
      if (response.data) {
        setRelatedTerms(response.data.terms.map(transformTerm))
      }
    } catch (err) {
      console.error("Fetch topic terms error:", err)
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
          <Link href="/trending" className="hover:text-foreground">
            热门话题
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{topic.title}</span>
        </nav>

        {/* Topic Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Hash className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{topic.title}</h1>
                  <p className="text-muted-foreground">{topic.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {(topic.followers / 1000).toFixed(1)}k 关注者
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {topic.discussions} 讨论
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  热度上升中
                </span>
              </div>
            </div>
            <Button>关注话题</Button>
          </div>
        </div>

        {/* Related Terms */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">相关词条</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : relatedTerms.length > 0 ? (
            <div className="space-y-4">
              {relatedTerms.map((term) => (
                <TermCard key={term.id} term={term} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Hash className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">暂无相关词条</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
