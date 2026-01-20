"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, Clock, BookOpen, Users, Tag } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TermCard } from "@/components/term-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiGet } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"
import { Loader2 } from "lucide-react"

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [filteredTerms, setFilteredTerms] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setQuery(initialQuery)
    setSearchQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    if (searchQuery) {
      performSearch()
    } else {
      setFilteredTerms([])
      setFilteredUsers([])
      setFilteredCategories([])
    }
  }, [searchQuery])

  const performSearch = async () => {
    setIsLoading(true)
    try {
      // 搜索词条
      const termsRes = await apiGet<{ terms: any[] }>(`/terms?status=published&pageSize=50`)
      if (termsRes.data) {
        const queryLower = searchQuery.toLowerCase()
        const filtered = termsRes.data.terms
          .filter(
            (t) =>
              t.title.toLowerCase().includes(queryLower) ||
              t.summary?.toLowerCase().includes(queryLower) ||
              t.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))
          )
          .map(transformTerm)
        setFilteredTerms(filtered)
      }

      // 搜索用户（暂时使用空数组，可以后续添加用户搜索API）
      setFilteredUsers([])

      // 搜索分类
      const categoriesRes = await apiGet<{ categories: any[] }>("/categories")
      if (categoriesRes.data) {
        const queryLower = searchQuery.toLowerCase()
        const filtered = categoriesRes.data.categories.filter(
          (c) =>
            c.label.toLowerCase().includes(queryLower) ||
            c.description?.toLowerCase().includes(queryLower)
        )
        setFilteredCategories(filtered)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(query)
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索词条、用户、话题..."
              className="pl-11 h-12 text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="px-8">
            搜索
          </Button>
        </form>

        {searchQuery && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>共找到 {filteredTerms.length + filteredUsers.length + filteredCategories.length} 个结果</span>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <Tabs defaultValue="terms" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="terms" className="gap-2">
              <BookOpen className="h-4 w-4" />
              词条 ({filteredTerms.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              用户 ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" />
              领域 ({filteredCategories.length})
            </TabsTrigger>
          </TabsList>

          {/* Terms Results */}
          <TabsContent value="terms" className="space-y-4">
            {filteredTerms.length > 0 ? (
              filteredTerms.map((term) => <TermCard key={term.id} term={term} />)
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">未找到相关词条</p>
              </div>
            )}
          </TabsContent>

          {/* Users Results */}
          <TabsContent value="users" className="space-y-4">
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/user/${user.id}`}
                    className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{user.name}</span>
                          {user.isVerified && <Badge className="text-xs">认证</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.specialties.slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">未找到相关用户</p>
              </div>
            )}
          </TabsContent>

          {/* Categories Results */}
          <TabsContent value="categories" className="space-y-4">
            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}?from=search`}
                    className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg ${cat.color} flex items-center justify-center text-white font-bold text-lg`}
                      >
                        {cat.label[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{cat.label}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{cat.description}</p>
                        <span className="text-xs text-muted-foreground">{cat.count} 词条</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">未找到相关领域</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State - No Query */}
      {!searchQuery && (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">开始搜索</h2>
          <p className="text-muted-foreground mb-6">输入关键词搜索词条、用户或领域</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-sm text-muted-foreground">热门搜索：</span>
            {["GPT-5", "量子计算", "脑机接口", "AGI"].map((term) => (
              <Badge
                key={term}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  setQuery(term)
                  setSearchQuery(term)
                }}
              >
                {term}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <PageLayout>
      <Suspense fallback={<div className="bg-card rounded-lg border border-border p-6 animate-pulse">加载中...</div>}>
        <SearchContent />
      </Suspense>
    </PageLayout>
  )
}
