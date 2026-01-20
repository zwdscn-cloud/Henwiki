"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Compass,
  TrendingUp,
  Sparkles,
  Clock,
  Grid,
  List,
  Loader2,
  Flame,
  ArrowUp,
  Eye,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Heart,
  Share2,
  MoreHorizontal,
  BadgeCheck,
} from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TermCard } from "@/components/term-card"
import { apiGet } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"
import { ShareCardGenerator } from "@/components/share-card-generator"
import { TipButton } from "@/components/tip-modal"

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k"
  }
  return num.toString()
}

export default function DiscoverPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeFilter, setActiveFilter] = useState("all")
  const [categories, setCategories] = useState<any[]>([])
  const [trendingTerms, setTrendingTerms] = useState<any[]>([])
  const [latestTerms, setLatestTerms] = useState<any[]>([])
  const [hotTopics, setHotTopics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [activeFilter])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 获取分类
      const categoriesResponse = await apiGet<{ categories: any[] }>("/categories")
      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data.categories)
      }

      // 获取热门词条
      const trendingResponse = await apiGet<{ terms: any[] }>(
        `/terms?status=published&orderBy=trending&pageSize=20`
      )
      if (trendingResponse.data) {
        let filtered = trendingResponse.data.terms.map(transformTerm)
        if (activeFilter !== "all") {
          filtered = filtered.filter((t) => t.categorySlug === activeFilter)
        }
        setTrendingTerms(filtered)
      }

      // 获取最新词条
      const latestResponse = await apiGet<{ terms: any[] }>(
        `/terms?status=published&orderBy=created_at&pageSize=10`
      )
      if (latestResponse.data) {
        setLatestTerms(latestResponse.data.terms.map(transformTerm))
      }

      // 获取热门话题（从热门标签中提取）
      if (trendingResponse.data) {
        const tagCounts = new Map<string, number>()
        trendingResponse.data.terms.forEach((term: any) => {
          term.tags?.forEach((tag: string) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
          })
        })
        const sortedTags = Array.from(tagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([tag, count], index) => ({
            id: index + 1,
            title: tag,
            count: `${count} 讨论`,
            trend: "+" + Math.floor(Math.random() * 50) + "%",
            isHot: index < 3,
          }))
        setHotTopics(sortedTags)
      }
    } catch (err) {
      console.error("Fetch discover data error:", err)
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
            <Compass className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">发现</h1>
          </div>
          <p className="text-muted-foreground">探索各个领域的前沿知识和热门话题</p>
        </div>

        {/* Featured Categories */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              热门领域
            </h2>
            <Link
              href="/categories"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              查看全部
              <ArrowUp className="h-3 w-3 rotate-45" />
            </Link>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categories.slice(0, 10).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}?from=discover`}
                  className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <div
                    className={`w-12 h-12 rounded-full ${cat.color || "bg-primary"} flex items-center justify-center text-white font-bold text-lg mb-2 group-hover:scale-110 transition-transform`}
                  >
                    {cat.label[0]}
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary text-center line-clamp-1 w-full">
                    {cat.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{cat.count || 0} 词条</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Hot Topics */}
        {hotTopics.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              热门话题
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {hotTopics.map((topic, index) => (
                <Link
                  key={topic.id}
                  href={`/tag/${encodeURIComponent(topic.title)}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <span
                    className={`text-lg font-bold shrink-0 ${
                      index < 3 ? "text-primary" : "text-muted-foreground/50"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {topic.title}
                      </span>
                      {topic.isHot && <Flame className="h-3 w-3 text-orange-500 shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{topic.count}</span>
                  </div>
                  <span className="text-xs text-green-500 font-medium flex items-center shrink-0">
                    <ArrowUp className="h-3 w-3" />
                    {topic.trend}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              本周热门
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge
              variant={activeFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveFilter("all")}
            >
              全部
            </Badge>
            {categories.slice(0, 6).map((cat) => (
              <Badge
                key={cat.slug}
                variant={activeFilter === cat.slug ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveFilter(cat.slug)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>

          {/* Terms Grid/List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trendingTerms.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "space-y-4"
              }
            >
              {trendingTerms.map((term) => (
                <article
                  key={term.id}
                  className="bg-card rounded-lg border border-border p-4 sm:p-5 hover:border-primary/50 hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                        <AvatarImage
                          src={term.author.avatar || "/placeholder.svg"}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                          {term.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate">
                            {term.author.name}
                          </span>
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            编辑了词条
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="whitespace-nowrap">{term.createdAt}</span>
                          <span className="hidden sm:inline">·</span>
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal px-1.5 sm:px-2 py-0 hidden sm:inline-flex shrink-0"
                          >
                            {term.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground shrink-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <Link href={`/term/${term.id}`} className="block group mb-3">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 flex items-center gap-2 line-clamp-2">
                      {term.title}
                      {term.isVerified && (
                        <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                      )}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {term.summary}
                    </p>
                  </Link>

                  <Badge
                    variant="secondary"
                    className="text-xs font-normal mb-3 sm:hidden"
                  >
                    {term.category}
                  </Badge>

                  {/* Tags */}
                  {term.tags && term.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      {term.tags.slice(0, 3).map((tag) => (
                        <Link
                          key={tag}
                          href={`/tag/${encodeURIComponent(tag)}`}
                          className="text-xs text-primary hover:text-primary/80 hover:underline truncate max-w-[120px] sm:max-w-none"
                        >
                          #{tag}
                        </Link>
                      ))}
                      {term.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{term.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
                    <div className="flex items-center gap-1 sm:gap-3 flex-wrap min-w-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary gap-1 sm:gap-2 h-8 px-2 sm:px-3 shrink-0"
                      >
                        <ThumbsUp className="h-4 w-4 shrink-0" />
                        <span className="text-xs whitespace-nowrap">
                          {formatNumber(term.stats.likes)}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary gap-1 sm:gap-2 h-8 px-2 sm:px-3 shrink-0"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" />
                        <span className="text-xs whitespace-nowrap">
                          {formatNumber(term.stats.comments)}
                        </span>
                      </Button>
                      <div className="hidden sm:flex items-center gap-1 text-muted-foreground/60 text-xs whitespace-nowrap">
                        <Eye className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatNumber(term.stats.views)} 阅读</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <TipButton
                        author={{
                          id: term.author.id || "author-1",
                          name: term.author.name,
                          avatar: term.author.avatar,
                        }}
                        termTitle={term.title}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-red-500"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedTerm(term)
                          setShareDialogOpen(true)
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">暂无热门词条</p>
            </div>
          )}
        </div>

        {/* Latest Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              最新收录
            </h2>
            <Link
              href="/latest"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              查看全部
              <ArrowUp className="h-3 w-3 rotate-45" />
            </Link>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : latestTerms.length > 0 ? (
            <div className="space-y-3">
              {latestTerms.map((term, index) => (
                <Link
                  key={term.id}
                  href={`/term/${term.id}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-xl sm:text-2xl font-bold text-muted-foreground/30 w-6 sm:w-8 shrink-0 text-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {term.title}
                      </h3>
                      {term.isVerified && (
                        <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{term.summary}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{term.createdAt}</span>
                      <span>·</span>
                      <span>{formatNumber(term.stats.views)} 阅读</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {term.category}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">暂无最新词条</p>
            </div>
          )}
        </div>
      </div>

      {selectedTerm && (
        <ShareCardGenerator
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          term={selectedTerm}
        />
      )}
    </PageLayout>
  )
}
