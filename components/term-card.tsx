"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, ThumbsUp, MessageCircle, Bookmark, Share2, MoreHorizontal, BadgeCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShareCardGenerator } from "@/components/share-card-generator"
import { TipButton } from "@/components/tip-modal"
import { BookmarkFolderDialog } from "@/components/bookmark-folder-dialog"
import { useAuth } from "@/lib/auth-context"
import { apiGet, apiPost, apiDelete } from "@/lib/utils/api"
import { useToast } from "@/hooks/use-toast"

interface TermCardProps {
  term: {
    id: string
    title: string
    category: string
    summary: string
    author: {
      id: string
      name: string
      avatar: string
    }
    stats: {
      views: number
      likes: number
      comments: number
    }
    tags: string[]
    createdAt: string
    isVerified: boolean
    status?: string
  }
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k"
  }
  return num.toString()
}

export function TermCard({ term }: TermCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkFolder, setBookmarkFolder] = useState("default")
  const [likesCount, setLikesCount] = useState(term.stats.likes)
  const [isLoading, setIsLoading] = useState(false)

  // 检查点赞和收藏状态
  useEffect(() => {
    if (user) {
      checkLikeStatus()
      checkBookmarkStatus()
    }
  }, [user, term.id])

  const checkLikeStatus = async () => {
    if (!user) return
    try {
      const response = await apiGet<{ liked: boolean }>(`/terms/${term.id}/like`)
      if (response.data) {
        setIsLiked(response.data.liked)
      }
    } catch (error) {
      // 静默失败，不影响UI
    }
  }

  const checkBookmarkStatus = async () => {
    if (!user) return
    try {
      const response = await apiGet<{ isBookmarked: boolean; folderName?: string }>(
        `/bookmarks/check?targetType=term&targetId=${term.id}`
      )
      if (response.data) {
        setIsBookmarked(response.data.isBookmarked)
        if (response.data.folderName) {
          setBookmarkFolder(response.data.folderName)
        }
      }
    } catch (error) {
      // 静默失败，不影响UI
    }
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后即可点赞",
      })
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (isLoading) return
    setIsLoading(true)

    try {
      const response = await apiPost<{ liked: boolean; likesCount: number }>(`/terms/${term.id}/like`)
      if (response.data) {
        setIsLiked(response.data.liked)
        setLikesCount(response.data.likesCount)
      } else if (response.error) {
        toast({
          title: "操作失败",
          description: response.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后即可收藏",
      })
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (isBookmarked) {
      // 取消收藏
      if (isLoading) return
      setIsLoading(true)

      try {
        const response = await apiDelete<{ message: string }>(
          `/bookmarks?targetType=term&targetId=${term.id}`
        )
        if (response.data || !response.error) {
          setIsBookmarked(false)
          toast({
            title: "已取消收藏",
          })
        } else {
          toast({
            title: "操作失败",
            description: response.error,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "操作失败",
          description: "网络错误，请稍后重试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      // 显示收藏夹选择对话框
      setBookmarkDialogOpen(true)
    }
  }

  const handleSelectFolder = async (folderName: string) => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const response = await apiPost<{ message: string }>(`/bookmarks`, {
        targetType: "term",
        targetId: term.id,
        folderName: folderName,
      })
      if (response.data || !response.error) {
        setIsBookmarked(true)
        setBookmarkFolder(folderName)
        toast({
          title: "收藏成功",
        })
      } else {
        toast({
          title: "操作失败",
          description: response.error || "收藏失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/term/${term.id}#comments`)
  }

  return (
    <>
      <article className="bg-card rounded-lg border border-border p-4 sm:p-5 hover:border-border/80 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
              <AvatarImage src={term.author.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                {term.author.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground truncate">{term.author.name}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">编辑了词条</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground flex-wrap">
                <span>{term.createdAt}</span>
                <span className="hidden sm:inline">·</span>
                <Badge variant="secondary" className="text-xs font-normal px-1.5 sm:px-2 py-0 hidden sm:inline-flex">
                  {term.category}
                </Badge>
                {term.status && term.status !== "published" && (
                  <>
                    <span className="hidden sm:inline">·</span>
                    <Badge 
                      variant={term.status === "pending" ? "secondary" : term.status === "rejected" ? "destructive" : "outline"}
                      className="text-xs font-normal px-1.5 sm:px-2 py-0"
                    >
                      {term.status === "pending" ? "待审核" : term.status === "rejected" ? "已拒绝" : "草稿"}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <Link href={`/term/${term.id}`} className="block group">
          <h2 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 flex items-center gap-2">
            {term.title}
            {term.isVerified && <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3">
            {term.summary}
          </p>
        </Link>

        <Badge variant="secondary" className="text-xs font-normal mb-2 sm:hidden">
          {term.category}
        </Badge>

        {/* Tags - 移动端显示更少标签 */}
        {term.tags && term.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {term.tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/tag/${tag}`} className="text-xs text-primary hover:text-primary/80 hover:underline">
                #{tag}
              </Link>
            ))}
            {term.tags.length > 3 && <span className="text-xs text-muted-foreground">+{term.tags.length - 3}</span>}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 sm:gap-2 h-8 px-2 sm:px-3 ${
                isLiked ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
              onClick={handleLike}
              disabled={isLoading}
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-xs">{formatNumber(likesCount)}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary gap-1 sm:gap-2 h-8 px-2 sm:px-3"
              onClick={handleComment}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{formatNumber(term.stats.comments)}</span>
            </Button>
            <div className="hidden sm:flex items-center gap-1 text-muted-foreground/60 text-xs">
              <Eye className="h-3.5 w-3.5" />
              <span>{formatNumber(term.stats.views)} 阅读</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TipButton
              author={{ id: term.author.id, name: term.author.name, avatar: term.author.avatar }}
              termTitle={term.title}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-red-500"
            />
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              onClick={handleBookmark}
              disabled={isLoading}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShareDialogOpen(true)
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </article>

      <ShareCardGenerator open={shareDialogOpen} onOpenChange={setShareDialogOpen} term={term} />
      <BookmarkFolderDialog
        open={bookmarkDialogOpen}
        onOpenChange={setBookmarkDialogOpen}
        onSelect={handleSelectFolder}
        currentFolder={bookmarkFolder}
      />
    </>
  )
}
