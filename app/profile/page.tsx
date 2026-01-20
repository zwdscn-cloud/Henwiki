"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  BadgeCheck,
  Calendar,
  Settings,
  Share2,
  BookOpen,
  MessageCircle,
  Star,
  Trophy,
  Flame,
  Gift,
  ChevronRight,
} from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TermCard } from "@/components/term-card"
import { useAuth } from "@/lib/auth-context"
import { apiGet } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"

export default function ProfilePage() {
  const { user, isLoading, checkIn } = useAuth()
  const router = useRouter()

  // 所有 useState hooks 必须在条件返回之前
  const [userTerms, setUserTerms] = useState<any[]>([])
  const [userComments, setUserComments] = useState<any[]>([])
  const [userBookmarks, setUserBookmarks] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("terms")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const fetchUserData = useCallback(async () => {
    if (!user) return

    try {
      // 获取我的词条（包括所有状态：已发布、待审核、已拒绝）
      // 不传 status 参数，后端会返回所有状态的词条（如果用户是作者）
      const termsResponse = await apiGet<{ terms: any[] }>(
        `/terms?authorId=${user.id}&status=all&pageSize=20`
      )
      if (termsResponse.data) {
        setUserTerms(termsResponse.data.terms.map(transformTerm))
      }

      // 获取我的评论
      const commentsResponse = await apiGet<{ comments: any[] }>(`/comments?userId=${user.id}&pageSize=10`)
      if (commentsResponse.data) {
        setUserComments(commentsResponse.data.comments || [])
      }

      // 获取我的收藏
      const bookmarksResponse = await apiGet<{ items: any[] }>(`/bookmarks`)
      if (bookmarksResponse.data) {
        setUserBookmarks(bookmarksResponse.data.items.filter((item) => item.type === "term") || [])
      }
    } catch (err) {
      console.error("Fetch user data error:", err)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user, fetchUserData])

  // 条件返回必须在所有 Hooks 之后
  if (isLoading || !user) {
    return (
      <PageLayout showRightSidebar={false}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </PageLayout>
    )
  }

  const nextLevelPoints = user.level * 500
  const currentLevelProgress = ((user.points % 500) / 500) * 100
  const todayCheckedIn = user.lastCheckIn === new Date().toISOString().split("T")[0]

  const handleCheckIn = async () => {
    const result = await checkIn()
    if (result.success) {
      alert(`签到成功！获得 ${result.points} 积分`)
    } else {
      alert("今日已签到")
    }
  }

  return (
    <PageLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="h-20 sm:h-32 bg-gradient-to-r from-primary/20 to-primary/5" />

          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-10 sm:-mt-12">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-card">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl sm:text-2xl">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{user.name}</h1>
                  {user.isVerified && <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />}
                  <Badge variant="secondary" className="text-xs">
                    Lv.{user.level}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{user.bio}</p>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    {user.joinedAt} 加入
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                    {user.contributions} 贡献
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                    连续签到 {user.streak} 天
                  </span>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" className="gap-2 bg-transparent flex-1 sm:flex-none text-sm" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">编辑资料</span>
                    <span className="sm:hidden">编辑</span>
                  </Link>
                </Button>
                <Button variant="outline" size="icon" className="bg-transparent shrink-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{user.contributions}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">贡献</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{user.followers.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">关注者</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{user.following}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">关注中</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-yellow-500/10 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                  {user.points}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">积分</p>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium">等级进度</span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {user.points % 500} / 500 到达 Lv.{user.level + 1}
                </span>
              </div>
              <Progress value={currentLevelProgress} className="h-2" />
            </div>

            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button
                onClick={handleCheckIn}
                disabled={todayCheckedIn}
                className={`flex-1 gap-2 text-sm ${todayCheckedIn ? "bg-muted text-muted-foreground" : ""}`}
                variant={todayCheckedIn ? "secondary" : "default"}
              >
                <Gift className="h-4 w-4" />
                {todayCheckedIn ? "今日已签到" : "每日签到"}
                {!todayCheckedIn && (
                  <span className="text-xs opacity-80">+{10 + Math.min(user.streak + 1, 7) * 5}</span>
                )}
              </Button>
              <Link href="/leaderboard" className="flex-1">
                <Button variant="outline" className="w-full gap-2 bg-transparent text-sm">
                  <Trophy className="h-4 w-4" />
                  查看排行榜
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </div>

            {/* Badges */}
            {user.badges.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">我的徽章</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {user.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/50 rounded-lg"
                      title={badge.description}
                    >
                      <span className="text-lg sm:text-xl">{badge.icon}</span>
                      <span className="text-xs sm:text-sm font-medium">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialties */}
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
              {user.specialties.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
          <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto">
            <TabsTrigger value="terms" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">词条贡献</span>
              <span className="sm:hidden">词条</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              评论
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              收藏
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="space-y-3 sm:space-y-4">
            {userTerms.length > 0 ? (
              userTerms.map((term) => <TermCard key={term.id} term={term} />)
            ) : (
              <div className="bg-card rounded-lg border border-border p-8 sm:p-12 text-center">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">暂无词条贡献</p>
                <Button className="mt-3 sm:mt-4 text-sm" asChild>
                  <Link href="/create">创建第一个词条</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {userComments.length > 0 ? (
              <div className="space-y-4">
                {userComments.map((comment) => (
                  <div key={comment.id} className="bg-card rounded-lg border border-border p-4">
                    <p className="text-sm text-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {comment.createdAt} · 在词条{" "}
                      <Link href={`/term/${comment.term_id}`} className="text-primary hover:underline">
                        #{comment.term_id}
                      </Link>{" "}
                      中
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-8 sm:p-12 text-center">
                <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">暂无评论</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-4">
            {userBookmarks.length > 0 ? (
              userBookmarks.map((item) => <TermCard key={item.id} term={item.term} />)
            ) : (
              <div className="bg-card rounded-lg border border-border p-8 sm:p-12 text-center">
                <Star className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">暂无收藏</p>
                <Button variant="outline" className="mt-3 sm:mt-4 bg-transparent text-sm" asChild>
                  <Link href="/discover">去发现词条</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
