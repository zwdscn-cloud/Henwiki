/**
 * 数据格式转换工具
 * 将数据库格式转换为前端组件需要的格式
 */

import type { TermWithRelations } from "@/lib/models/term"
import type { PaperWithRelations } from "@/lib/models/paper"
import type { CommentWithAuthor } from "@/lib/models/comment"

/**
 * 转换词条数据格式
 */
export function transformTerm(term: TermWithRelations) {
  return {
    id: term.id.toString(),
    title: term.title,
    category: term.category.label,
    categorySlug: term.category.slug,
    summary: term.summary || "",
    content: term.content || "",
    author: {
      id: term.author.id.toString(),
      name: term.author.name,
      avatar: term.author.avatar || "/placeholder-user.jpg",
      bio: "",
      contributions: 0,
    },
    stats: {
      views: term.views,
      likes: term.likes_count,
      comments: term.comments_count,
    },
    tags: term.tags,
    createdAt: formatRelativeTime(term.created_at),
    updatedAt: formatDate(term.updated_at),
    isVerified: term.is_verified,
    status: term.status,
    references: [],
  }
}

/**
 * 转换论文数据格式
 */
export function transformPaper(paper: PaperWithRelations) {
  return {
    id: paper.id.toString(),
    title: paper.title,
    titleCn: paper.title_cn || "",
    abstract: paper.abstract || "",
    abstractCn: paper.abstract_cn || "",
    category: paper.category.label,
    categorySlug: paper.category.slug,
    journal: paper.journal || "",
    publishDate: paper.publish_date || "",
    arxivId: paper.arxiv_id || "",
    doi: paper.doi || "",
    pdfUrl: paper.pdf_url || "",
    pdfFilePath: paper.pdf_file_path || "",
    tags: paper.tags,
    stats: {
      citations: paper.citations,
      views: paper.views,
      downloads: paper.downloads,
      likes: paper.likes_count,
    },
    authors: paper.authors.map((a) => ({
      name: a.name,
      affiliation: a.affiliation || "",
    })),
    relatedTerms: [],
    isHighlighted: paper.is_highlighted,
  }
}

/**
 * 转换评论数据格式
 */
export function transformComment(comment: CommentWithAuthor) {
  return {
    id: comment.id.toString(),
    termId: comment.term_id.toString(),
    author: {
      id: comment.author.id.toString(),
      name: comment.author.name,
      avatar: comment.author.avatar || "/placeholder-user.jpg",
    },
    content: comment.content,
    likes: comment.likes_count,
    createdAt: formatRelativeTime(comment.created_at),
    replies: comment.replies?.map(transformComment) || [],
  }
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return "刚刚"
  }
}

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
