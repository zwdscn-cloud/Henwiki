"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Users,
  MessageSquare,
  Trophy,
  Flame,
  Star,
  ArrowUp,
  MessageCircle,
  Loader2,
  Clock,
  Eye,
  ThumbsUp,
  Pin,
  Lock,
  TrendingUp,
  BadgeCheck,
} from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateDiscussionDialog } from "@/components/create-discussion-dialog"
import { apiGet } from "@/lib/utils/api"
import { useAuth } from "@/lib/auth-context"

function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + "万"
  if (num >= 1000) return (num / 1000).toFixed(1) + "k"
  return num.toString()
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("discussions")
  const [discussions, setDiscussions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"last_reply_at" | "created_at" | "replies_count" | "likes_count" | "views">(
    "last_reply_at"
  )
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    if (activeTab === "discussions") {
      fetchDiscussions()
      fetchCategories()
    } else if (activeTab === "leaderboard" || activeTab === "experts") {
      fetchLeaderboard()
    }
  }, [activeTab, sortBy, selectedCategory])

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

  const fetchDiscussions = async () => {
    setIsLoadingDiscussions(true)
    try {
      const params = new URLSearchParams({
        status: "published",
        sortBy: sortBy,
        pageSize: "30",
      })
      if (selectedCategory !== "all") {
        params.append("categoryId", selectedCategory)
      }

      const response = await apiGet<{ discussions: any[] }>(`/discussions?${params.toString()}`)
      if (response.data) {
        setDiscussions(response.data.discussions)
      }
    } catch (err) {
      console.error("Fetch discussions error:", err)
    } finally {
      setIsLoadingDiscussions(false)
      setIsLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<{ users: any[] }>("/leaderboard?type=contributions&timeRange=weekly&limit=20")
      if (response.data) {
        setLeaderboardUsers(response.data.users)
      }
    } catch (err) {
      console.error("Fetch leaderboard error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">社区</h1>
              </div>
              <p className="text-muted-foreground">与志同道合的人交流前沿科技话题</p>
            </div>
            <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
              <MessageSquare className="h-4 w-4" />
              发起讨论
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="discussions" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              讨论区
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="h-4 w-4" />
              贡献榜
            </TabsTrigger>
            <TabsTrigger value="experts" className="gap-2">
              <Star className="h-4 w-4" />
              专家
            </TabsTrigger>
          </TabsList>

          {/* Discussions Tab */}
          <TabsContent value="discussions" className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_reply_at">最新回复</SelectItem>
                    <SelectItem value="created_at">最新发布</SelectItem>
                    <SelectItem value="replies_count">最多回复</SelectItem>
                    <SelectItem value="likes_count">最多点赞</SelectItem>
                    <SelectItem value="views">最多浏览</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Discussions List */}
            {isLoadingDiscussions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : discussions.length > 0 ? (
              <div className="space-y-3">
                {discussions.map((discussion) => (
                  <Link
                    key={discussion.id}
                    href={`/community/discussion/${discussion.id}`}
                    className="block bg-card rounded-lg border border-border p-4 sm:p-5 hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* 左侧：作者头像 */}
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                        <AvatarImage src={discussion.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {discussion.author.name[0]}
                        </AvatarFallback>
                      </Avatar>

                      {/* 中间：内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 flex-1">
                            {discussion.is_pinned && (
                              <Pin className="h-4 w-4 text-primary inline mr-1 shrink-0" />
                            )}
                            {discussion.is_locked && (
                              <Lock className="h-4 w-4 text-muted-foreground inline mr-1 shrink-0" />
                            )}
                            {discussion.title}
                          </h3>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {discussion.content.replace(/[#*\[\]]/g, "").substring(0, 150)}
                          {discussion.content.length > 150 ? "..." : ""}
                        </p>

                        <div className="flex items-center gap-3 flex-wrap">
                          {/* 分类 */}
                          {discussion.category && (
                            <Badge variant="secondary" className="text-xs">
                              {discussion.category.label}
                            </Badge>
                          )}

                          {/* 标签 */}
                          {discussion.tags && discussion.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {discussion.tags.slice(0, 3).map((tag: string) => (
                                <span key={tag} className="text-xs text-primary hover:underline">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 作者 */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{discussion.author.name}</span>
                            {discussion.author.isVerified && (
                              <BadgeCheck className="h-3 w-3 text-primary" />
                            )}
                          </div>

                          {/* 时间 */}
                          {discussion.last_reply_at && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(discussion.last_reply_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 右侧：统计数据 */}
                      <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5" title="回复数">
                          <MessageCircle className="h-4 w-4" />
                          <span className="min-w-[2rem] text-right">{discussion.replies_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="点赞数">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="min-w-[2rem] text-right">{formatNumber(discussion.likes_count)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 hidden sm:flex" title="浏览数">
                          <Eye className="h-4 w-4" />
                          <span className="min-w-[2.5rem] text-right">{formatNumber(discussion.views)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">暂无讨论</h3>
                <p className="text-sm text-muted-foreground mb-4">成为第一个发起讨论的人吧！</p>
                <Button onClick={() => setCreateDialogOpen(true)}>发起讨论</Button>
              </div>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    本周贡献榜
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {leaderboardUsers.map((user, index) => (
                    <Link
                      key={user.id}
                      href={`/user/${user.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span
                        className={`text-2xl font-bold w-8 ${
                          index === 0
                            ? "text-yellow-500"
                            : index === 1
                              ? "text-gray-400"
                              : index === 2
                                ? "text-amber-600"
                                : "text-muted-foreground/30"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{user.name}</span>
                          {user.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              认证专家
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.contributions} 贡献</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-primary">
                          <ArrowUp className="h-4 w-4" />
                          <span className="font-semibold">{user.contributions}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">贡献</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Experts Tab */}
          <TabsContent value="experts" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaderboardUsers.map((user) => (
                  <div key={user.id} className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{user.name}</span>
                          {user.isVerified && <Badge className="text-xs">认证</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{user.bio || "暂无简介"}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{user.followers} 关注者</span>
                          <span>{user.contributions} 贡献</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/user/${user.id}`}>查看主页</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateDiscussionDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </PageLayout>
  )
}
