"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileText,
  BookOpen,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { apiGet } from "@/lib/utils/api"
import { useAuth } from "@/lib/auth-context"

interface Stats {
  totalTerms: number
  totalPapers: number
  totalUsers: number
  todayViews: number
  termsChange: string
  papersChange: string
  usersChange: string
  viewsChange: string
}

interface PendingItem {
  id: string
  type: "term" | "paper"
  title: string
  author: string
  avatar: string
  category: string
  submittedAt: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading, hasAnyPermission } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 等待认证状态加载完成
    if (authLoading) return

    // 如果未登录，跳转到登录页
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/admin")}`)
      return
    }

    // 检查是否有后台访问权限
    if (!hasAnyPermission(['admin.dashboard.view', 'admin.stats.view'])) {
      router.push('/?error=admin_required')
      return
    }

    fetchData()
  }, [user, authLoading, router, hasAnyPermission])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [statsResponse, pendingResponse] = await Promise.all([
        apiGet<{ stats: Stats; pending: { terms: number; papers: number; total: number } }>(
          "/admin/stats"
        ),
        apiGet<{ items: PendingItem[] }>("/admin/pending?limit=10"),
      ])

      if (statsResponse.error) {
        // 如果是未授权错误，apiRequest 已经处理了跳转
        if (statsResponse.error.includes("未授权") || statsResponse.error.includes("登录")) {
          return // 跳转已经在 apiRequest 中处理
        }
        setError(statsResponse.error)
      } else if (statsResponse.data) {
        setStats(statsResponse.data.stats)
      }

      if (pendingResponse.error) {
        // 如果是未授权错误，apiRequest 已经处理了跳转
        if (pendingResponse.error.includes("未授权") || pendingResponse.error.includes("登录")) {
          return // 跳转已经在 apiRequest 中处理
        }
        console.error("Failed to fetch pending items:", pendingResponse.error)
      } else if (pendingResponse.data) {
        setPendingItems(pendingResponse.data.items)
      }
    } catch (err: any) {
      setError(err.message || "加载失败")
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "万"
    }
    return num.toLocaleString()
  }

  // 如果正在加载认证状态或未登录，显示加载中（跳转会在 useEffect 中处理）
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 如果没有后台访问权限，显示错误提示（跳转会在 useEffect 中处理）
  if (!hasAnyPermission(['admin.dashboard.view', 'admin.stats.view'])) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-destructive mb-4">权限不足，需要后台访问权限才能访问管理页面</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">
          重试
        </Button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statsCards = [
    {
      title: "总词条数",
      value: formatNumber(stats.totalTerms),
      change: `${stats.termsChange.startsWith("-") ? "" : "+"}${stats.termsChange}%`,
      trend: parseFloat(stats.termsChange) >= 0 ? "up" : "down",
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "总论文数",
      value: formatNumber(stats.totalPapers),
      change: `${stats.papersChange.startsWith("-") ? "" : "+"}${stats.papersChange}%`,
      trend: parseFloat(stats.papersChange) >= 0 ? "up" : "down",
      icon: BookOpen,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "注册用户",
      value: formatNumber(stats.totalUsers),
      change: `${stats.usersChange.startsWith("-") ? "" : "+"}${stats.usersChange}%`,
      trend: parseFloat(stats.usersChange) >= 0 ? "up" : "down",
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "今日访问",
      value: formatNumber(stats.todayViews),
      change: `${stats.viewsChange.startsWith("-") ? "" : "+"}${stats.viewsChange}%`,
      trend: parseFloat(stats.viewsChange) >= 0 ? "up" : "down",
      icon: Eye,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  // 热门搜索词（暂时使用空数据，后续可以实现）
  const hotSearches: { keyword: string; count: number; change: number }[] = []

  // 最近活动（暂时使用空数据，后续可以实现）
  const recentActivities: {
    action: string
    target: string
    user: string
    time: string
    status: string
  }[] = []
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground">欢迎回来，管理员！这是今日的数据概览。</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>最后更新: {new Date().toLocaleString("zh-CN")}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>{stat.change}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Reviews */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                待审核内容
              </CardTitle>
              <CardDescription>共 {pendingItems.length} 条内容等待审核</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/review">
                查看全部 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无待审核内容
                </div>
              ) : (
                pendingItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={item.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{item.author[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.type === "term" ? "词条" : "论文"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.author}</span>
                          <span>·</span>
                          <span>{item.category}</span>
                          <span>·</span>
                          <span>{item.submittedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <Link href={`/admin/review?type=${item.type === "term" ? "terms" : "papers"}&view=${item.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          查看
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 hover:text-green-700 bg-transparent"
                        asChild
                      >
                        <Link href={`/admin/review?type=${item.type === "term" ? "terms" : "papers"}`}>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          通过
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
                        asChild
                      >
                        <Link href={`/admin/review?type=${item.type === "term" ? "terms" : "papers"}`}>
                          <XCircle className="mr-1 h-4 w-4" />
                          拒绝
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hot Searches */}
        <Card>
          <CardHeader>
            <CardTitle>热门搜索</CardTitle>
            <CardDescription>过去24小时的热门搜索词</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hotSearches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无搜索数据
                </div>
              ) : (
                hotSearches.map((item, index) => (
                  <div key={item.keyword} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                        index < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.keyword}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.count.toLocaleString()}</span>
                    <span className={`text-xs ${item.change > 0 ? "text-green-500" : "text-red-500"}`}>
                      {item.change > 0 ? "+" : ""}
                      {item.change}%
                    </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
          <CardDescription>管理员操作记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无活动记录
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "danger"
                          ? "bg-red-500"
                          : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{activity.user}</span>
                    <span className="text-muted-foreground"> {activity.action} </span>
                    <span className="font-medium">{activity.target}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
