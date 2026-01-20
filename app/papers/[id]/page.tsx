"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Quote,
  Eye,
  Download,
  Heart,
  ExternalLink,
  Calendar,
  Building,
  BookOpen,
  Share2,
  Bookmark,
  MessageSquare,
  ChevronRight,
  Send,
  Lightbulb,
  Loader2,
} from "lucide-react"
import { apiGet, apiPost, apiDelete } from "@/lib/utils/api"
import { transformPaper, transformTerm } from "@/lib/utils/data-transform"

interface Paper {
  id: string
  title: string
  titleCn?: string
  abstract: string
  abstractCn?: string
  category: string
  categorySlug: string
  journal: string
  publishDate: string
  arxivId?: string
  doi?: string
  pdfUrl?: string
  tags: string[]
  stats: {
    citations: number
    views: number
    downloads: number
    likes: number
  }
  authors: Array<{ name: string; affiliation: string }>
  isHighlighted: boolean
}

export default function PaperDetailPage() {
  const params = useParams()
  const paperId = params.id as string

  const [paper, setPaper] = useState<Paper | null>(null)
  const [relatedTerms, setRelatedTerms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showCnAbstract, setShowCnAbstract] = useState(true)
  const [newComment, setNewComment] = useState("")

  useEffect(() => {
    fetchPaper()
  }, [paperId])

  const fetchPaper = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiGet<{ paper: any }>(`/papers/${paperId}`)
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        const transformed = transformPaper(response.data.paper)
        setPaper(transformed)

        // 检查是否已点赞
        const likeResponse = await apiGet<{ isLiked: boolean }>(`/papers/${paperId}/like`)
        if (likeResponse.data) {
          setIsLiked(likeResponse.data.isLiked)
        }

        // 检查是否已收藏
        const bookmarkResponse = await apiGet<{ items: any[] }>(`/bookmarks?type=paper`)
        if (bookmarkResponse.data) {
          const bookmarked = bookmarkResponse.data.items.some(
            (item: any) => item.type === "paper" && item.paper?.id === paperId
          )
          setIsBookmarked(bookmarked)
        }

        // 获取相关词条（使用相同分类的词条）
        const termsResponse = await apiGet<{ terms: any[] }>(
          `/terms?categoryId=${response.data.paper.category.id}&pageSize=4`
        )
        if (termsResponse.data) {
          setRelatedTerms(termsResponse.data.terms.map(transformTerm))
        }
      }
    } catch (err: any) {
      setError(err.message || "加载失败")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async () => {
    try {
      const response = await apiPost<{ isLiked: boolean; likesCount: number }>(`/papers/${paperId}/like`)
      if (response.data) {
        setIsLiked(response.data.isLiked)
        if (paper) {
          setPaper({
            ...paper,
            stats: {
              ...paper.stats,
              likes: response.data.likesCount,
            },
          })
        }
      }
    } catch (err) {
      console.error("Like error:", err)
    }
  }

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await apiDelete(`/bookmarks?targetType=paper&targetId=${paperId}`)
        setIsBookmarked(false)
      } else {
        await apiPost(`/bookmarks`, {
          targetType: "paper",
          targetId: parseInt(paperId),
        })
        setIsBookmarked(true)
      }
    } catch (err) {
      console.error("Bookmark error:", err)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      // 论文评论功能可以后续实现
      setNewComment("")
      alert("评论功能开发中")
    } catch (err) {
      console.error("Comment error:", err)
    }
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (error || !paper) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium">{error || "论文不存在"}</h3>
        </div>
      </PageLayout>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + "万"
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  return (
    <PageLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/papers" className="hover:text-foreground">
            论文库
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{paper.title}</span>
        </nav>

        {/* Paper Header */}
        <article className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">{paper.category}</Badge>
            <Badge variant="secondary">{paper.journal}</Badge>
            {paper.isHighlighted && <Badge className="bg-primary/10 text-primary">精选论文</Badge>}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">{paper.title}</h1>
          {paper.titleCn && <p className="text-lg text-muted-foreground mb-4">{paper.titleCn}</p>}

          {/* Authors */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-2">作者</h3>
            <div className="flex flex-wrap gap-3">
              {paper.authors.map((author, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{author.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">{author.name}</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {author.affiliation}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              发布于 {paper.publishDate}
            </span>
            {paper.arxivId && (
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                arXiv: {paper.arxivId}
              </span>
            )}
            {paper.doi && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                DOI: {paper.doi}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 py-4 border-y border-border mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{formatNumber(paper.stats.citations)}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Quote className="h-3 w-3" /> 引用
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{formatNumber(paper.stats.views)}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" /> 浏览
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{formatNumber(paper.stats.downloads)}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Download className="h-3 w-3" /> 下载
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{formatNumber(paper.stats.likes)}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="h-3 w-3" /> 喜欢
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            {paper.pdfUrl && (
              <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2">
                  <FileText className="h-4 w-4" />
                  下载 PDF
                </Button>
              </a>
            )}
            {paper.arxivId && (
              <a href={`https://arxiv.org/abs/${paper.arxivId}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <ExternalLink className="h-4 w-4" />
                  查看 arXiv
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              className={`gap-2 ${isLiked ? "text-red-500 border-red-500/30" : ""}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              {isLiked ? "已喜欢" : "喜欢"}
            </Button>
            <Button
              variant="outline"
              className={`gap-2 ${isBookmarked ? "text-primary border-primary/30" : ""}`}
              onClick={handleBookmark}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
              {isBookmarked ? "已收藏" : "收藏"}
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              分享
            </Button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {paper.tags.map((tag) => (
              <Link key={tag} href={`/papers?tag=${encodeURIComponent(tag)}`}>
                <Badge variant="secondary" className="hover:bg-secondary/80">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </article>

        {/* Abstract */}
        <section className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">摘要</h2>
            <div className="flex gap-2">
              <Button variant={showCnAbstract ? "default" : "ghost"} size="sm" onClick={() => setShowCnAbstract(true)}>
                中文
              </Button>
              <Button
                variant={!showCnAbstract ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowCnAbstract(false)}
              >
                English
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {showCnAbstract && paper.abstractCn ? paper.abstractCn : paper.abstract}
          </p>
        </section>

        {/* Related Terms */}
        {relatedTerms.length > 0 && (
          <section className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              相关词条
            </h2>
            <div className="grid gap-3">
              {relatedTerms.map((term) => (
                <Link
                  key={term.id}
                  href={`/term/${term.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{term.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{term.summary}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Discussions */}
        <section className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            论文解读与讨论
          </h2>

          <p className="text-muted-foreground text-sm mb-6">暂无解读，来写第一篇吧！</p>

          {/* Add Comment */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">发表你的看法</h3>
            <Textarea
              placeholder="写下你对这篇论文的理解、疑问或讨论..."
              className="mb-3"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button size="sm" className="gap-2" onClick={handleSubmitComment}>
              <Send className="h-4 w-4" />
              发布
            </Button>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
