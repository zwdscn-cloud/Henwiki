"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Eye,
  Clock,
  Pin,
  Lock,
  BadgeCheck,
  Reply,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { apiGet, apiPost } from "@/lib/utils/api"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

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

export default function DiscussionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const id = params.id as string
  const [discussion, setDiscussion] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchDiscussion()
      fetchReplies()
      if (user) {
        checkLikeStatus()
      }
    }
  }, [id, user])

  const fetchDiscussion = async () => {
    try {
      const response = await apiGet<{ discussion: any }>(`/discussions/${id}`)
      if (response.data) {
        setDiscussion(response.data.discussion)
      } else {
        router.push("/community")
      }
    } catch (error) {
      console.error("Fetch discussion error:", error)
      router.push("/community")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReplies = async () => {
    try {
      const response = await apiGet<{ replies: any[] }>(`/discussions/${id}/replies`)
      if (response.data) {
        setReplies(response.data.replies)
      }
    } catch (error) {
      console.error("Fetch replies error:", error)
    }
  }

  const checkLikeStatus = async () => {
    if (!user) return
    try {
      const response = await apiGet<{ liked: boolean }>(`/discussions/${id}/like`)
      if (response.data) {
        setIsLiked(response.data.liked)
      }
    } catch (error) {
      console.error("Check like status error:", error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      router.push("/login?redirect=/community/discussion/" + id)
      return
    }
    try {
      const response = await apiPost<{ liked: boolean; likesCount: number }>(`/discussions/${id}/like`)
      if (response.data) {
        setIsLiked(response.data.liked)
        if (discussion) {
          setDiscussion({ ...discussion, likes_count: response.data.likesCount })
        }
      }
    } catch (error) {
      console.error("Like error:", error)
    }
  }

  const handleSubmitReply = async () => {
    if (!user) {
      router.push("/login?redirect=/community/discussion/" + id)
      return
    }

    if (!replyContent.trim()) {
      toast({
        title: "请输入回复内容",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiPost<{ replyId: number }>(`/discussions/${id}/replies`, {
        content: replyContent.trim(),
        parentId: replyingTo || undefined,
      })

      if (response.data) {
        setReplyContent("")
        setReplyingTo(null)
        toast({
          title: "回复成功",
        })
        fetchReplies()
        fetchDiscussion() // 更新回复数
      } else if (response.error) {
        toast({
          title: "回复失败",
          description: response.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "回复失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderReply = (reply: any, depth: number = 0) => {
    return (
      <div key={reply.id} className={depth > 0 ? "ml-8 mt-4" : ""}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={reply.author.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {reply.author.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {reply.parent_author && (
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                  {reply.parent_author.name} → {reply.author.name}
                </span>
              )}
              <span className="font-medium text-sm text-foreground">{reply.author.name}</span>
              {reply.author.isVerified && <BadgeCheck className="h-3 w-3 text-primary" />}
              <span className="text-xs text-muted-foreground">{formatTimeAgo(reply.created_at)}</span>
              {reply.is_accepted && (
                <Badge variant="default" className="text-xs">
                  已采纳
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">{reply.content}</p>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground gap-1"
                onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
              >
                <Reply className="h-3 w-3" />
                <span className="text-xs">回复</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground gap-1">
                <ThumbsUp className="h-3 w-3" />
                <span className="text-xs">{formatNumber(reply.likes_count)}</span>
              </Button>
            </div>

            {/* 嵌套回复 */}
            {reply.replies && reply.replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {reply.replies.map((subReply: any) => renderReply(subReply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <PageLayout showRightSidebar={false}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (!discussion) {
    return (
      <PageLayout showRightSidebar={false}>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">讨论不存在</p>
          <Button onClick={() => router.push("/community")} variant="outline">
            返回社区
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout showRightSidebar={false}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/community" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            社区
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">讨论详情</span>
        </nav>

        {/* Discussion Header */}
        <article className="bg-card rounded-lg border border-border">
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={discussion.author.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {discussion.author.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                    {discussion.is_pinned && <Pin className="h-5 w-5 text-primary shrink-0" />}
                    {discussion.is_locked && <Lock className="h-5 w-5 text-muted-foreground shrink-0" />}
                    {discussion.title}
                  </h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5">
                    <span>{discussion.author.name}</span>
                    {discussion.author.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(discussion.created_at)}
                  </span>
                  {discussion.category && (
                    <Badge variant="secondary" className="text-xs">
                      {discussion.category.label}
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {discussion.tags && discussion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {discussion.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/tag/${encodeURIComponent(tag)}`}
                        className="text-xs text-primary hover:underline"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-sm max-w-none mb-4">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{discussion.content}</p>
                </div>

                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      <span>{formatNumber(discussion.views)} 浏览</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4" />
                      <span>{discussion.replies_count} 回复</span>
                    </div>
                  </div>
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={handleLike}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {formatNumber(discussion.likes_count)}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Reply Section */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            回复 ({discussion.replies_count})
          </h3>

          {/* Reply Input */}
          {replyingTo && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              正在回复 #{replyingTo}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6"
                onClick={() => setReplyingTo(null)}
              >
                取消
              </Button>
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.name?.[0] || "用"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={user ? "写下你的回复..." : "请先登录"}
                className="min-h-[100px] resize-none mb-2"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={!user || isSubmitting || discussion.is_locked}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!user || !replyContent.trim() || isSubmitting || discussion.is_locked}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    "发表回复"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Replies List */}
          {replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map((reply) => renderReply(reply))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>暂无回复，成为第一个回复的人吧！</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
