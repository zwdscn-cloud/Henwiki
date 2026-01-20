"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, Loader2, Heart, MessageCircle, Eye, Sparkles } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TermCard } from "@/components/term-card"
import { PaperCard } from "@/components/paper-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiGet } from "@/lib/utils/api"
import { transformTerm, transformPaper } from "@/lib/utils/data-transform"
import { useAuth } from "@/lib/auth-context"

export default function FollowingPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [terms, setTerms] = useState<any[]>([])
  const [papers, setPapers] = useState<any[]>([])
  const [followingUsers, setFollowingUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("terms")

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/following")
        return
      }
      fetchData()
    }
  }, [user, authLoading, router])

  const fetchData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // 并行获取关注的人列表和关注的人创建的词条
      const [followingResponse, termsResponse] = await Promise.all([
        apiGet<{ users: any[] }>(`/users/${user.id}/followers?type=following`),
        apiGet<{ terms: any[] }>(`/terms/following?pageSize=50`),
      ])

      if (followingResponse.data) {
        setFollowingUsers(followingResponse.data.users)
      }

      if (termsResponse.data) {
        const transformedTerms = termsResponse.data.terms.map(transformTerm)
        setTerms(transformedTerms)
      } else {
        setTerms([])
      }

      // 注意：论文表目前没有 author_id 字段，暂时无法按用户筛选论文
      // 可以后续添加此功能
      setPapers([])
    } catch (err) {
      console.error("Fetch following content error:", err)
      // 如果获取关注动态失败，至少显示关注的人列表
      try {
        const followingResponse = await apiGet<{ users: any[] }>(
          `/users/${user.id}/followers?type=following`
        )
        if (followingResponse.data) {
          setFollowingUsers(followingResponse.data.users)
        }
      } catch (followErr) {
        console.error("Fetch following users error:", followErr)
      }
      setTerms([])
      setPapers([])
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">关注动态</h1>
              <p className="text-muted-foreground">
                查看你关注的人创建的最新词条和论文
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                已关注 {followingUsers.length} 人
              </span>
            </div>
          </div>
        </div>

        {/* Following Users List */}
        {followingUsers.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="font-semibold text-foreground mb-3">我关注的人</h2>
            <div className="flex flex-wrap gap-3">
              {followingUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/user/${user.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {user.name[0]}
                  </div>
                  <span className="text-sm text-foreground">{user.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="terms" className="gap-2">
              <Sparkles className="h-4 w-4" />
              词条 ({terms.length})
            </TabsTrigger>
            <TabsTrigger value="papers" className="gap-2">
              <Eye className="h-4 w-4" />
              论文 ({papers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="space-y-4">
            {terms.length > 0 ? (
              <div className="space-y-4">
                {terms.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">暂无关注的人创建的词条</p>
                <p className="text-sm text-muted-foreground/70 mb-4">
                  去关注一些用户，看看他们创建的内容吧
                </p>
                <Button variant="outline" asChild>
                  <Link href="/discover">发现用户</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="papers" className="space-y-4">
            {papers.length > 0 ? (
              <div className="space-y-4">
                {papers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Eye className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">暂无关注的人创建的论文</p>
                <p className="text-sm text-muted-foreground/70 mb-4">
                  去关注一些用户，看看他们提交的论文吧
                </p>
                <Button variant="outline" asChild>
                  <Link href="/discover">发现用户</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
