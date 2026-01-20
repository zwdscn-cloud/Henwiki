"use client"

import type React from "react"

import Link from "next/link"
import { FileText, Quote, Eye, Download, Heart, ExternalLink, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface PaperAuthor {
  name: string
  affiliation: string
}

interface PaperCardProps {
  paper: {
    id: string
    title: string
    titleCn?: string
    authors: PaperAuthor[]
    abstract: string
    abstractCn?: string
    category: string
    categorySlug: string
    journal: string
    publishDate: string
    arxivId?: string | null
    doi?: string
    pdfUrl?: string | null
    tags: string[]
    stats: { citations: number; views: number; downloads: number; likes: number }
    isHighlighted?: boolean
  }
  showAbstract?: boolean
}

export function PaperCard({ paper, showAbstract = true }: PaperCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(paper.stats.likes)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + "万"
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  const displayAuthors = paper.authors.slice(0, 3)
  const hasMoreAuthors = paper.authors.length > 3

  return (
    <article className="bg-card rounded-lg border border-border p-4 sm:p-5 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {paper.category}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">{paper.journal}</span>
          {paper.isHighlighted && <Badge className="bg-primary/10 text-primary text-xs">精选</Badge>}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Calendar className="h-3 w-3" />
          <span className="hidden sm:inline">{paper.publishDate}</span>
          <span className="sm:hidden">{paper.publishDate.slice(5)}</span>
        </div>
      </div>

      {/* Title */}
      <Link href={`/papers/${paper.id}`}>
        <h3 className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors mb-1 line-clamp-2">
          {paper.title}
        </h3>
        {paper.titleCn && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-1">{paper.titleCn}</p>
        )}
      </Link>

      {/* Authors */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground">
        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        <span className="truncate">
          {displayAuthors.map((author, i) => (
            <span key={author.name}>
              {author.name}
              {i < displayAuthors.length - 1 && ", "}
            </span>
          ))}
          {hasMoreAuthors && <span className="text-muted-foreground/60"> 等</span>}
        </span>
      </div>

      {/* Abstract */}
      {showAbstract && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
          {paper.abstractCn || paper.abstract}
        </p>
      )}

      {/* Tags - 移动端显示更少 */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        {paper.tags.slice(0, 3).map((tag) => (
          <Link key={tag} href={`/papers?tag=${encodeURIComponent(tag)}`}>
            <Badge variant="secondary" className="text-xs hover:bg-secondary/80">
              {tag}
            </Badge>
          </Link>
        ))}
        {paper.tags.length > 3 && (
          <span className="text-xs text-muted-foreground hidden sm:inline">+{paper.tags.length - 3}</span>
        )}
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
        <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" title="引用数">
            <Quote className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {formatNumber(paper.stats.citations)}
          </span>
          <span className="flex items-center gap-1" title="浏览量">
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {formatNumber(paper.stats.views)}
          </span>
          <span className="hidden sm:flex items-center gap-1" title="下载量">
            <Download className="h-3.5 w-3.5" />
            {formatNumber(paper.stats.downloads)}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 sm:h-8 px-1.5 sm:px-2 ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
            onClick={handleLike}
          >
            <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLiked ? "fill-current" : ""}`} />
            <span className="ml-1 text-xs">{formatNumber(likeCount)}</span>
          </Button>
          {paper.pdfUrl && (
            <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-7 sm:h-8 gap-1 bg-transparent text-xs px-2">
                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </a>
          )}
          {paper.arxivId && (
            <a
              href={`https://arxiv.org/abs/${paper.arxivId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block"
            >
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent text-xs">
                <ExternalLink className="h-3.5 w-3.5" />
                arXiv
              </Button>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
