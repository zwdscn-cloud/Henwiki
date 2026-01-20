"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronRight, TrendingUp, Clock, Users, Loader2, Sparkles, Check, Compass } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TermCard } from "@/components/term-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiGet, apiPut } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"
import { useAuth } from "@/lib/auth-context"

export default function CategoryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const from = searchParams?.get("from") || "terms" // 默认为词条库，可选值：discover, terms, search
  const { user, updateProfile } = useAuth()
  const [category, setCategory] = useState<any>(null)
  const [categoryTerms, setCategoryTerms] = useState<any[]>([])
  const [relatedCategories, setRelatedCategories] = useState<any[]>([])
  const [topContributors, setTopContributors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState("recommended")
  const [isFollowing, setIsFollowing] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    fetchData()
  }, [slug, sortBy])

  useEffect(() => {
    if (user && category) {
      setIsFollowing(user.specialties?.includes(category.slug) || false)
    } else {
      setIsFollowing(false)
    }
  }, [user, category])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 获取分类信息
      const categoriesResponse = await apiGet<{ categories: any[] }>("/categories")
      if (categoriesResponse.data) {
        const foundCategory = categoriesResponse.data.categories.find((c) => c.slug === slug)
        const currentCategory = foundCategory || categoriesResponse.data.categories[0]
        setCategory(currentCategory)
        setRelatedCategories(
          categoriesResponse.data.categories.filter((c) => c.slug !== slug).slice(0, 4)
        )

        // 获取分类词条（使用找到的分类）
        if (currentCategory) {
          let orderBy = "created_at"
          if (sortBy === "trending") {
            orderBy = "trending"
          } else if (sortBy === "recommended") {
            orderBy = "recommended"
          }
          const termsResponse = await apiGet<{ terms: any[] }>(
            `/terms?categoryId=${currentCategory.id}&status=published&orderBy=${orderBy}&pageSize=50`
          )
          if (termsResponse.data) {
            setCategoryTerms(termsResponse.data.terms.map(transformTerm))
          }
        }
      }

      // 获取领域专家（该分类下贡献最多的用户）
      if (category) {
        const leaderboardResponse = await apiGet<{ users: any[] }>(
          `/leaderboard?type=contributions&timeRange=all&limit=3&categoryId=${category.id}`
        )
        if (leaderboardResponse.data) {
          setTopContributors(leaderboardResponse.data.users)
        }
      }
    } catch (err) {
      console.error("Fetch category data error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFollow = async () => {
    if (!user || !category) {
      return
    }

    setIsToggling(true)
    try {
      const currentSpecialties = user.specialties || []
      let newSpecialties: string[]

      if (isFollowing) {
        // 取消关注
        newSpecialties = currentSpecialties.filter((s) => s !== category.slug)
      } else {
        // 关注
        newSpecialties = [...currentSpecialties, category.slug]
      }

      const response = await apiPut(`/users/${user.id}`, {
        specialties: newSpecialties,
      })

      if (response.error) {
        alert(response.error)
      } else {
        updateProfile({ specialties: newSpecialties })
        setIsFollowing(!isFollowing)
      }
    } catch (err) {
      console.error("Toggle follow category error:", err)
      alert("操作失败")
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <PageLayout showRightSidebar={false}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            首页
          </Link>
          <ChevronRight className="h-4 w-4" />
          {from === "discover" ? (
            <>
              <Link href="/discover" className="hover:text-foreground flex items-center gap-1">
                <Compass className="h-3.5 w-3.5" />
                发现
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{category?.label || "加载中..."}</span>
            </>
          ) : (
            <>
              <Link href="/terms" className="hover:text-foreground">
                词条库
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{category?.label || "加载中..."}</span>
            </>
          )}
        </nav>

        {/* Category Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-xl ${category?.color || "bg-primary"} flex items-center justify-center text-white font-bold text-2xl`}
            >
              {category?.label?.[0] || "?"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">{category?.label || "加载中..."}</h1>
              <p className="text-muted-foreground mb-4">{category?.description || ""}</p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {categoryTerms.length} 词条
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {Math.floor(categoryTerms.length * 2.5)} 关注者
                </span>
              </div>
            </div>
            {user ? (
              <Button
                onClick={handleToggleFollow}
                disabled={isToggling}
                variant={isFollowing ? "outline" : "default"}
                className={isFollowing ? "bg-transparent" : ""}
              >
                {isToggling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : isFollowing ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    已关注
                  </>
                ) : (
                  "关注领域"
                )}
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/login?redirect=${encodeURIComponent(`/category/${slug}`)}`}>
                  关注领域
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Filter Tabs */}
            <div className="bg-card rounded-lg border border-border p-1 flex gap-1">
              <Button
                variant={sortBy === "recommended" ? "default" : "ghost"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setSortBy("recommended")}
              >
                <Sparkles className="h-4 w-4" />
                推荐
              </Button>
              <Button
                variant={sortBy === "trending" ? "default" : "ghost"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setSortBy("trending")}
              >
                <TrendingUp className="h-4 w-4" />
                热门
              </Button>
              <Button
                variant={sortBy === "latest" ? "default" : "ghost"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setSortBy("latest")}
              >
                <Clock className="h-4 w-4" />
                最新
              </Button>
            </div>

            {/* Terms List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categoryTerms.length > 0 ? (
              <div className="space-y-4">
                {categoryTerms.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <p className="text-muted-foreground">该领域暂无词条</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-72 space-y-4">
            {/* Top Contributors */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3">领域专家</h3>
              <div className="space-y-3">
                {topContributors.map((user) => (
                  <Link key={user.id} href={`/user/${user.id}`}>
                    <div className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.contributions} 贡献</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Related Categories */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3">相关领域</h3>
              <div className="space-y-2">
                {relatedCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}?from=${from}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <span className="text-sm text-foreground">{cat.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {cat.count || 0}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
