"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, Flame, Clock, ArrowUp, Loader2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TermCard } from "@/components/term-card"
import { apiGet } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"

const trendingTopics = [
  { id: 1, title: "AGI", count: "2.3万讨论", trend: "+45%", isHot: true },
  { id: 2, title: "量子霸权", count: "1.8万讨论", trend: "+32%", isHot: true },
  { id: 3, title: "脑机接口", count: "1.2万讨论", trend: "+28%", isHot: false },
  { id: 4, title: "可控核聚变", count: "9.5k讨论", trend: "+21%", isHot: false },
  { id: 5, title: "基因疗法", count: "8.2k讨论", trend: "+18%", isHot: false },
  { id: 6, title: "室温超导", count: "7.8k讨论", trend: "+15%", isHot: true },
  { id: 7, title: "Sora", count: "6.5k讨论", trend: "+12%", isHot: true },
  { id: 8, title: "神经形态计算", count: "5.2k讨论", trend: "+10%", isHot: false },
]

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState("views")
  const [terms, setTerms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTerms()
  }, [activeTab])

  const fetchTerms = async () => {
    setIsLoading(true)
    try {
      let orderBy: "trending" | "views" | "likes_count" = "trending"
      if (activeTab === "views") orderBy = "views"
      else if (activeTab === "likes") orderBy = "likes_count"
      else if (activeTab === "comments") orderBy = "trending" // 使用 trending 作为评论排序的近似

      const response = await apiGet<{ terms: any[] }>(
        `/terms?status=published&pageSize=50&orderBy=${orderBy}`
      )
      if (response.data) {
        setTerms(response.data.terms.map(transformTerm))
      }
    } catch (err) {
      console.error("Fetch terms error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const sortedByViews = [...terms].sort((a, b) => b.stats.views - a.stats.views)
  const sortedByLikes = [...terms].sort((a, b) => b.stats.likes - a.stats.likes)

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">热门</h1>
          </div>
          <p className="text-muted-foreground">发现当前最热门的词条和话题</p>
        </div>

        {/* Trending Topics */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            热门话题
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trendingTopics.map((topic, index) => (
              <Link
                key={topic.id}
                href={`/tag/${topic.title}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <span className={`text-lg font-bold ${index < 3 ? "text-primary" : "text-muted-foreground/50"}`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground truncate">{topic.title}</span>
                    {topic.isHot && <Flame className="h-3 w-3 text-orange-500" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{topic.count}</span>
                </div>
                <span className="text-xs text-green-500 font-medium flex items-center">
                  <ArrowUp className="h-3 w-3" />
                  {topic.trend}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Terms */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="views" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              最多阅读
            </TabsTrigger>
            <TabsTrigger value="likes" className="gap-2">
              <Flame className="h-4 w-4" />
              最多点赞
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <Clock className="h-4 w-4" />
              最多讨论
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="views" className="space-y-4">
                {sortedByViews.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </TabsContent>

              <TabsContent value="likes" className="space-y-4">
                {sortedByLikes.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                {terms.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </PageLayout>
  )
}
