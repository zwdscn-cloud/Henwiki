"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, Users, Zap, ChevronRight, FileText, Quote, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiGet } from "@/lib/utils/api"
import { transformTerm, transformPaper } from "@/lib/utils/data-transform"

export function RightSidebar() {
  const [dailyPick, setDailyPick] = useState<any>(null)
  const [hotPapers, setHotPapers] = useState<any[]>([])
  const [topContributors, setTopContributors] = useState<any[]>([])
  const [trendingTopics, setTrendingTopics] = useState<any[]>([])

  useEffect(() => {
    fetchSidebarData()
  }, [])

  const fetchSidebarData = async () => {
    try {
      // 获取今日推荐词条（使用推荐算法）
      const dailyPickResponse = await apiGet<{ terms: any[] }>(
        "/terms?status=published&orderBy=recommended&pageSize=1"
      )
      if (dailyPickResponse.data && dailyPickResponse.data.terms.length > 0) {
        const term = transformTerm(dailyPickResponse.data.terms[0])
        setDailyPick({
          title: term.title,
          description: term.summary,
          category: term.category,
          id: term.id,
        })
      }

      // 获取热门论文
      const papersResponse = await apiGet<{ papers: any[] }>(
        "/papers?status=published&orderBy=views&pageSize=3"
      )
      if (papersResponse.data) {
        setHotPapers(
          papersResponse.data.papers.map((p) => transformPaper(p)).slice(0, 3)
        )
      }

      // 获取活跃贡献者
      const contributorsResponse = await apiGet<{ users: any[] }>(
        "/leaderboard?type=contributions&timeRange=weekly&limit=3"
      )
      if (contributorsResponse.data) {
        setTopContributors(contributorsResponse.data.users)
      }

      // 获取热门话题（使用热门标签）
      const trendingResponse = await apiGet<{ terms: any[] }>(
        "/terms?status=published&orderBy=trending&pageSize=5"
      )
      if (trendingResponse.data) {
        // 提取热门标签作为话题
        const tagCounts = new Map<string, number>()
        trendingResponse.data.terms.forEach((term: any) => {
          term.tags?.forEach((tag: string) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
          })
        })
        const sortedTags = Array.from(tagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count], index) => ({
            id: index + 1,
            title: tag,
            count: `${count} 讨论`,
            trend: "+" + Math.floor(Math.random() * 50) + "%", // 临时数据
          }))
        setTrendingTopics(sortedTags)
      }
    } catch (err) {
      console.error("Fetch sidebar data error:", err)
    }
  }
  return (
    <div className="sticky top-20 space-y-5">
      {/* Daily Pick */}
      {dailyPick && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">今日高能词条</h3>
          </div>
          <Link href={`/term/${dailyPick.id}`} className="block group">
            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
              {dailyPick.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">
              {dailyPick.description}
            </p>
            <Badge variant="secondary" className="text-xs">
              {dailyPick.category}
            </Badge>
          </Link>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">热门论文</h3>
          </div>
          <Link href="/papers" className="text-xs text-primary hover:underline">
            查看全部
          </Link>
        </div>
        <div className="space-y-3">
          {hotPapers.length > 0 ? (
            hotPapers.map((paper, index) => (
              <Link key={paper.id} href={`/papers/${paper.id}`} className="block group">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-5 shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {paper.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Quote className="h-3 w-3" />
                        {paper.stats?.citations?.toLocaleString() || 0}
                      </span>
                      {paper.journal && <span>{paper.journal}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-2">暂无数据</div>
          )}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">热门话题</h3>
          </div>
          <Link href="/trending" className="text-xs text-primary hover:underline">
            查看全部
          </Link>
        </div>
        <div className="space-y-3">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic, index) => (
              <Link
                key={topic.id}
                href={`/tag/${encodeURIComponent(topic.title)}`}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-5">{index + 1}</span>
                  <div>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {topic.title}
                    </span>
                    <p className="text-xs text-muted-foreground">{topic.count}</p>
                  </div>
                </div>
                <span className="text-xs text-green-500 font-medium">{topic.trend}</span>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-2">暂无数据</div>
          )}
        </div>
      </div>

      {/* Top Contributors */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">活跃贡献者</h3>
          </div>
        </div>
        <div className="space-y-3">
          {topContributors.length > 0 ? (
            topContributors.map((user) => (
              <Link
                key={user.id}
                href={`/user/${user.id}`}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.contributions} 贡献</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-2">暂无数据</div>
          )}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-3 text-muted-foreground" asChild>
          <Link href="/leaderboard">
            查看更多
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Ad / Promo */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-4">
        <h4 className="font-medium text-sm text-foreground mb-2">成为贡献者</h4>
        <p className="text-xs text-muted-foreground mb-3">分享你的专业知识，帮助更多人了解前沿科技</p>
        <Button size="sm" className="w-full">
          立即申请
        </Button>
      </div>
    </div>
  )
}
