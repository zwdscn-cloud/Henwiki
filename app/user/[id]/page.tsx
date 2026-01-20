"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { BadgeCheck, Calendar, Settings, Share2, BookOpen, MessageCircle, UsersIcon, Loader2 } from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TermCard } from "@/components/term-card"
import { apiGet, apiPost, apiDelete } from "@/lib/utils/api"
import { transformTerm } from "@/lib/utils/data-transform"
import { useAuth } from "@/lib/auth-context"

export default function UserProfilePage() {
  const params = useParams()
  const id = params.id as string
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [userTerms, setUserTerms] = useState<any[]>([])
  const [userComments, setUserComments] = useState<any[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState("terms")

  const isOwnProfile = currentUser?.id?.toString() === id

  useEffect(() => {
    fetchUserData()
  }, [id])

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      // 获取用户信息
      const userResponse = await apiGet<{ user: any }>(`/users/${id}`)
      if (userResponse.data) {
        const userData = userResponse.data.user
        setUser({
          id: userData.id.toString(),
          name: userData.name,
          avatar: userData.avatar || "/placeholder.svg",
          bio: userData.bio || "",
          contributions: userData.contributions || 0,
          followers: userData.followers_count || 0,
          following: userData.following_count || 0,
          isVerified: userData.is_verified || false,
          joinedAt: new Date(userData.joined_at).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
          }),
          specialties: userData.specialties || [],
          badges: userData.badges || [],
        })

        // 检查是否已关注
        if (currentUser && !isOwnProfile) {
          const followResponse = await apiGet<{ isFollowing: boolean }>(`/users/${id}/follow`)
          if (followResponse.data) {
            setIsFollowing(followResponse.data.isFollowing)
          }
        }
      }

      // 获取用户词条
      const termsResponse = await apiGet<{ terms: any[] }>(`/terms?authorId=${id}&status=published&pageSize=10`)
      if (termsResponse.data) {
        setUserTerms(termsResponse.data.terms.map(transformTerm))
      }

      // 获取用户评论
      const commentsResponse = await apiGet<{ comments: any[] }>(`/comments?userId=${id}&pageSize=10`)
      if (commentsResponse.data) {
        setUserComments(commentsResponse.data.comments || [])
      }

      // 获取关注者列表
      const followersResponse = await apiGet<{ users: any[] }>(`/users/${id}/followers?type=followers`)
      if (followersResponse.data) {
        setFollowers(followersResponse.data.users || [])
      }
    } catch (err) {
      console.error("Fetch user data error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await apiDelete(`/users/${id}/follow`)
        setIsFollowing(false)
      } else {
        await apiPost(`/users/${id}/follow`, {})
        setIsFollowing(true)
      }
      fetchUserData()
    } catch (err) {
      console.error("Follow error:", err)
    }
  }

  if (isLoading) {
    return (
      <PageLayout showRightSidebar={false}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (!user) {
    return (
      <PageLayout showRightSidebar={false}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">用户不存在</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">{user.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                  {user.isVerified && <BadgeCheck className="h-6 w-6 text-primary" />}
                </div>
                <p className="text-muted-foreground mb-3">{user.bio}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {user.joinedAt} 加入
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {user.contributions} 贡献
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Button variant="outline" className="gap-2 bg-transparent" asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4" />
                      编辑资料
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button className="gap-2" onClick={handleFollow}>
                      {isFollowing ? "已关注" : "关注"}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{user.contributions}</p>
                <p className="text-sm text-muted-foreground">贡献</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{user.followers.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">关注者</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{user.following}</p>
                <p className="text-sm text-muted-foreground">关注中</p>
              </div>
            </div>

            {/* Specialties */}
            {user.specialties && user.specialties.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {user.specialties.map((s: string) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="terms" className="gap-2">
              <BookOpen className="h-4 w-4" />
              词条贡献
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              评论
            </TabsTrigger>
            <TabsTrigger value="followers" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              关注者
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="space-y-4">
            {userTerms.length > 0 ? (
              userTerms.map((term) => <TermCard key={term.id} term={term} />)
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无词条贡献</p>
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
                      {comment.createdAt} · 在词条 <Link href={`/term/${comment.termId}`} className="text-primary hover:underline">#{comment.termId}</Link> 中
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无评论</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="space-y-4">
            {followers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followers.map((follower) => (
                  <Link
                    key={follower.id}
                    href={`/user/${follower.id}`}
                    className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={follower.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary">{follower.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{follower.name}</span>
                          {follower.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{follower.contributions} 贡献</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <UsersIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无关注者</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
