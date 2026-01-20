"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Search, Filter, SortAsc, Grid, List, Loader2, Eye, ThumbsUp, Clock, BadgeCheck } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TermCard } from "@/components/term-card"
import { apiGet } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"

function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + "万"
  if (num >= 1000) return (num / 1000).toFixed(1) + "k"
  return num.toString()
}

export default function TermsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [viewMode, setViewMode] = useState<"compact" | "card">("compact")
  const [terms, setTerms] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchTerms()
  }, [selectedCategory, sortBy])

  const fetchCategories = async () => {
    try {
      const response = await apiGet<{ categories: any[] }>("/categories")
      if (response.data) {
        setCategories(response.data.categories)
      }
    } catch (err) {
      console.error("Fetch categories error:", err)
    }
  }

  const fetchTerms = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const categoryId =
        selectedCategory !== "all"
          ? categories.find((c) => c.slug === selectedCategory)?.id
          : undefined

      let orderBy: "created_at" | "views" | "likes_count" = "created_at"
      if (sortBy === "views") orderBy = "views"
      else if (sortBy === "likes") orderBy = "likes_count"

      const params = new URLSearchParams({
        status: "published",
        page: "1",
        pageSize: "50",
        orderBy,
      })
      if (categoryId) params.append("categoryId", categoryId.toString())
      if (searchQuery) params.append("search", searchQuery)

      const response = await apiGet<{ terms: any[] }>(`/terms?${params.toString()}`)
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        let filtered = response.data.terms.map(transformTerm)

        // 客户端搜索过滤
        if (searchQuery) {
          filtered = filtered.filter(
            (term) =>
              term.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              term.summary.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        setTerms(filtered)
      }
    } catch (err: any) {
      setError(err.message || "加载失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">词条库</h1>
          </div>
          <p className="text-muted-foreground">
            浏览和搜索所有收录的前沿科技词条，目前共收录 {terms.length} 个词条
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索词条..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchTerms()
                  }
                }}
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="选择领域" />
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

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">最新</SelectItem>
                <SelectItem value="views">最多阅读</SelectItem>
                <SelectItem value="likes">最多点赞</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center gap-1 border border-border rounded-md p-1">
              <Button
                variant={viewMode === "compact" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("compact")}
                title="紧凑列表"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("card")}
                title="卡片视图"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedCategory !== "all") && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">筛选条件：</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                搜索: {searchQuery}
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-foreground">
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {categories.find((c) => c.slug === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-foreground">
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && <div className="text-sm text-muted-foreground">共找到 {terms.length} 个词条</div>}

        {/* Terms List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <>
            {viewMode === "compact" ? (
              /* 紧凑列表视图 - 专业运营设计 */
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {terms.length > 0 ? (
                    terms.map((term) => (
                      <Link
                        key={term.id}
                        href={`/term/${term.id}`}
                        className="block px-4 py-3 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* 左侧：标题和分类 */}
                          <div className="flex-1 min-w-0 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                  {term.title}
                                </h3>
                                {term.isVerified && (
                                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {term.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {term.createdAt}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 右侧：统计数据 */}
                          <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Eye className="h-4 w-4" />
                              <span className="min-w-[3rem] text-right">
                                {formatNumber(term.stats.views)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ThumbsUp className="h-4 w-4" />
                              <span className="min-w-[2.5rem] text-right">
                                {formatNumber(term.stats.likes)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-12 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-medium text-foreground mb-2">未找到匹配的词条</h3>
                      <p className="text-sm text-muted-foreground">尝试调整搜索条件或筛选条件</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 卡片视图 - 保留作为可选视图 */
              <div className="space-y-4">
                {terms.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </div>
            )}

            {/* Load More */}
            {terms.length > 0 && (
              <div className="flex justify-center py-4">
                <Button variant="outline" className="text-muted-foreground bg-transparent">
                  加载更多词条
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}
