"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Users, Eye, FileText, Clock, Download, Calendar, Loader2 } from "lucide-react"
import { apiGet } from "@/lib/utils/api"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// 访问量数据
const visitData = [
  { date: "01/01", pv: 12000, uv: 8500 },
  { date: "01/02", pv: 15000, uv: 10200 },
  { date: "01/03", pv: 13500, uv: 9100 },
  { date: "01/04", pv: 18000, uv: 12500 },
  { date: "01/05", pv: 16500, uv: 11800 },
  { date: "01/06", pv: 21000, uv: 14200 },
  { date: "01/07", pv: 19500, uv: 13500 },
]

// 分类数据
const categoryData = [
  { name: "人工智能", value: 35, color: "#3b82f6" },
  { name: "生物科技", value: 20, color: "#22c55e" },
  { name: "量子计算", value: 15, color: "#a855f7" },
  { name: "芯片半导体", value: 12, color: "#f59e0b" },
  { name: "新能源", value: 10, color: "#ef4444" },
  { name: "其他", value: 8, color: "#6b7280" },
]

// 用户增长数据
const userGrowthData = [
  { month: "7月", users: 15000 },
  { month: "8月", users: 18500 },
  { month: "9月", users: 21000 },
  { month: "10月", users: 23500 },
  { month: "11月", users: 25800 },
  { month: "12月", users: 28456 },
]

// 热门词条
const topTerms = [
  { title: "GPT-5", views: 125000, change: 45 },
  { title: "室温超导体 LK-99", views: 98000, change: -12 },
  { title: "Sora", views: 87000, change: 156 },
  { title: "脑机接口", views: 65000, change: 23 },
  { title: "量子纠错", views: 54000, change: 8 },
]

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d")
  const [overview, setOverview] = useState<any>(null)
  const [visitTrend, setVisitTrend] = useState<any[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([])
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  const [topTerms, setTopTerms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<{
        overview: any
        visitTrend: any[]
        categoryDistribution: any[]
        userGrowth: any[]
        topTerms: any[]
      }>(`/admin/analytics?timeRange=${timeRange}`)
      if (response.data) {
        setOverview(response.data.overview)
        setVisitTrend(response.data.visitTrend || [])
        setCategoryDistribution(response.data.categoryDistribution || [])
        setUserGrowth(response.data.userGrowth || [])
        setTopTerms(response.data.topTerms || [])
      }
    } catch (err) {
      console.error("Fetch analytics error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">数据分析</h1>
          <p className="text-muted-foreground">平台运营数据概览和趋势分析</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">今天</SelectItem>
              <SelectItem value="7d">最近7天</SelectItem>
              <SelectItem value="30d">最近30天</SelectItem>
              <SelectItem value="90d">最近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出报告
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-blue-500/10 p-2.5">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-500">
                {overview?.pvChange > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    +{overview.pvChange}%
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4" />
                    {overview?.pvChange || 0}%
                  </>
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  overview?.pv?.toLocaleString() || "0"
                )}
              </p>
              <p className="text-sm text-muted-foreground">总浏览量 (PV)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-green-500/10 p-2.5">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-500">
                {overview?.uvChange > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    +{overview.uvChange}%
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4" />
                    {overview?.uvChange || 0}%
                  </>
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  overview?.uv?.toLocaleString() || "0"
                )}
              </p>
              <p className="text-sm text-muted-foreground">独立访客 (UV)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-purple-500/10 p-2.5">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex items-center gap-1 text-sm text-red-500">
                <TrendingDown className="h-4 w-4" />
                -5.3%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{overview?.avgStayTime || "0:00"}</p>
              <p className="text-sm text-muted-foreground">平均停留时间</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-orange-500/10 p-2.5">
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="h-4 w-4" />
                +12.8%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{overview?.avgTermsPerUser || "0"}</p>
              <p className="text-sm text-muted-foreground">人均浏览词条</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Traffic Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>访问趋势</CardTitle>
            <CardDescription>每日 PV/UV 数据</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitTrend.length > 0 ? visitTrend : visitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pv"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="浏览量"
                  />
                  <Line type="monotone" dataKey="uv" stroke="#22c55e" strokeWidth={2} dot={false} name="访客数" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>分类分布</CardTitle>
            <CardDescription>词条浏览量按分类统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution.length > 0 ? categoryDistribution : categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {(categoryDistribution.length > 0 ? categoryDistribution : categoryData).map(
                      (entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#3b82f6"} />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(categoryDistribution.length > 0 ? categoryDistribution : categoryData).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color || "#3b82f6" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name} {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>用户增长</CardTitle>
            <CardDescription>月度注册用户数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowth.length > 0 ? userGrowth : userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="用户数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Terms */}
        <Card>
          <CardHeader>
            <CardTitle>热门词条 Top 5</CardTitle>
            <CardDescription>按浏览量排序</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(topTerms.length > 0 ? topTerms : topTerms).map((term, index) => (
                <div key={term.title} className="flex items-center gap-4">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                      index < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{term.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {(term.views || 0).toLocaleString()} 次浏览
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      (term.change || 0) > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {(term.change || 0) > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {(term.change || 0) > 0 ? "+" : ""}
                    {term.change || 0}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
