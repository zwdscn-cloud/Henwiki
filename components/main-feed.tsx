"use client"

import { useState, useEffect } from "react"
import { TermCard } from "@/components/term-card"
import { AdSlot } from "@/components/native-ad"
import { Button } from "@/components/ui/button"
import { Flame, Clock, Sparkles, Loader2 } from "lucide-react"
import { apiGet } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"
import { useAuth } from "@/lib/auth-context"

const tabs = [
  { id: "recommended", label: "推荐", icon: Sparkles },
  { id: "trending", label: "热门", icon: Flame },
  { id: "latest", label: "最新", icon: Clock },
]

export function MainFeed() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("recommended")
  const [terms, setTerms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTerms()
  }, [activeTab, user])

  const fetchTerms = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let orderBy: "created_at" | "views" | "likes_count" | "recommended" | "trending" = "created_at"
      if (activeTab === "trending") {
        orderBy = "trending"
      } else if (activeTab === "recommended") {
        orderBy = "recommended"
      } else if (activeTab === "latest") {
        orderBy = "created_at"
      }

      const response = await apiGet<{ terms: any[] }>(
        `/terms?status=published&page=1&pageSize=20&orderBy=${orderBy}`
      )

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        const transformedTerms = response.data.terms.map(transformTerm)
        setTerms(transformedTerms)
      }
    } catch (err: any) {
      setError(err.message || "加载失败")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchTerms} variant="outline">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-card rounded-lg border border-border p-1 flex gap-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 gap-2 ${activeTab === tab.id ? "" : "text-muted-foreground hover:text-foreground"}`}
            >
              <IconComponent className="h-4 w-4" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {terms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            暂无词条数据
          </div>
        ) : (
          terms.map((term, index) => (
            <div key={term.id}>
              <TermCard term={term} />
              <AdSlot index={index} />
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {terms.length > 0 && (
        <div className="flex justify-center py-4">
          <Button variant="outline" className="text-muted-foreground bg-transparent">
            加载更多词条
          </Button>
        </div>
      )}
    </div>
  )
}
