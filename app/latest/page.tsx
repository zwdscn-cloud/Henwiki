"use client"

import { useState, useEffect } from "react"
import { Clock, Calendar, Filter, Loader2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TermCard } from "@/components/term-card"
import { apiGet } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"

export default function LatestPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [timeRange, setTimeRange] = useState("today")
  const [terms, setTerms] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // 确保分类已加载后再获取词条
    if (categoriesLoaded) {
      fetchTerms()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, timeRange, categoriesLoaded])

  const fetchCategories = async () => {
    try {
      const response = await apiGet<{ categories: any[] }>("/categories")
      if (response.data) {
        setCategories(response.data.categories)
        setCategoriesLoaded(true)
      }
    } catch (err) {
      console.error("Fetch categories error:", err)
      setCategoriesLoaded(true) // 即使失败也标记为已加载，避免阻塞
    }
  }

  const fetchTerms = async () => {
    setIsLoading(true)
    try {
      const categoryId =
        selectedCategory !== "all"
          ? categories.find((c) => c.slug === selectedCategory)?.id
          : undefined

      const params = new URLSearchParams({
        status: "published",
        page: "1",
        pageSize: "50",
        orderBy: "created_at",
      })
      if (categoryId) params.append("categoryId", categoryId.toString())

      const response = await apiGet<{ terms: any[] }>(`/terms?${params.toString()}`)
      if (response.data) {
        // 在转换之前进行时间过滤，使用原始的 created_at 字段
        let filtered = response.data.terms

        // 按时间范围过滤（使用原始数据）
        if (timeRange !== "all") {
          const now = new Date()
          let cutoffDate: Date

          if (timeRange === "today") {
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          } else if (timeRange === "week") {
            cutoffDate = new Date(now)
            cutoffDate.setDate(cutoffDate.getDate() - 7)
          } else if (timeRange === "month") {
            cutoffDate = new Date(now)
            cutoffDate.setMonth(cutoffDate.getMonth() - 1)
          } else {
            cutoffDate = new Date(0) // 全部时间
          }

          filtered = filtered.filter((term) => {
            const termDate = new Date(term.created_at)
            return termDate >= cutoffDate
          })
        }

        // 转换数据格式，同时保留原始日期用于分组
        const transformed = filtered.map((term) => {
          const transformedTerm = transformTerm(term)
          // 保留原始日期用于分组
          return {
            ...transformedTerm,
            rawCreatedAt: term.created_at,
          }
        })
        setTerms(transformed)
      }
    } catch (err) {
      console.error("Fetch terms error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // 按日期分组（使用原始 created_at 字段）
  const groupedTerms = terms.reduce((acc, term) => {
    const rawDate = (term as any).rawCreatedAt
    if (!rawDate) return acc

    const date = new Date(rawDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    let group = "other"
    if (date >= today) group = "today"
    else if (date >= yesterday) group = "yesterday"
    else if (date >= weekAgo) group = "week"

    if (!acc[group]) acc[group] = []
    acc[group].push(term)
    return acc
  }, {} as Record<string, any[]>)
  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">最新收录</h1>
          </div>
          <p className="text-muted-foreground">查看最新添加和更新的词条</p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4 flex flex-wrap items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="领域" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部领域</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="时间" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="all">全部时间</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTerms.today && groupedTerms.today.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    今天
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-4">
                  {groupedTerms.today.map((term) => (
                    <TermCard key={term.id} term={term} />
                  ))}
                </div>
              </div>
            )}

            {groupedTerms.yesterday && groupedTerms.yesterday.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    昨天
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-4">
                  {groupedTerms.yesterday.map((term) => (
                    <TermCard key={term.id} term={term} />
                  ))}
                </div>
              </div>
            )}

            {groupedTerms.week && groupedTerms.week.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    本周
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-4">
                  {groupedTerms.week.map((term) => (
                    <TermCard key={term.id} term={term} />
                  ))}
                </div>
              </div>
            )}

            {groupedTerms.other && groupedTerms.other.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    更早
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-4">
                  {groupedTerms.other.map((term) => (
                    <TermCard key={term.id} term={term} />
                  ))}
                </div>
              </div>
            )}

            {terms.length === 0 && (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无词条</p>
              </div>
            )}
          </div>
        )}

        {/* Load More */}
        <div className="flex justify-center py-4">
          <Button variant="outline" className="text-muted-foreground bg-transparent">
            加载更多
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
