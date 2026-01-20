"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Star,
  BookOpen,
  MessageCircle,
  TrendingUp,
  Calendar,
  ChevronRight,
  Award,
  Loader2,
} from "lucide-react"
import { PageLayout } from "@/components/page-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiGet } from "@/lib/utils/api"
import { users } from "@/lib/mock-data"

// Extended mock data for leaderboard (fallback data, not currently used)
const leaderboardUsers = [
  {
    ...users[0],
    rank: 1,
    points: 15800,
    weeklyPoints: 580,
    contributions: 234,
    streak: 45,
    badges: 12,
    trend: "up",
  },
  {
    ...users[1],
    id: "u2",
    rank: 2,
    points: 12450,
    weeklyPoints: 420,
    contributions: 189,
    streak: 32,
    badges: 9,
    trend: "up",
  },
  {
    ...users[2],
    id: "u3",
    rank: 3,
    points: 11200,
    weeklyPoints: 380,
    contributions: 167,
    streak: 28,
    badges: 8,
    trend: "down",
  },
  {
    id: "u4",
    name: "量子物理博士",
    avatar: "/quantum-physicist-portrait.jpg",
    rank: 4,
    points: 9800,
    weeklyPoints: 320,
    contributions: 145,
    streak: 21,
    badges: 7,
    trend: "up",
    isVerified: true,
  },
  {
    id: "u5",
    name: "生物学博士",
    avatar: "/biologist-avatar.jpg",
    rank: 5,
    points: 8650,
    weeklyPoints: 290,
    contributions: 132,
    streak: 18,
    badges: 6,
    trend: "same",
    isVerified: true,
  },
  {
    id: "u6",
    name: "芯片工程师",
    avatar: "/chip-engineer-avatar.jpg",
    rank: 6,
    points: 7420,
    weeklyPoints: 250,
    contributions: 118,
    streak: 15,
    badges: 5,
    trend: "up",
    isVerified: false,
  },
  {
    id: "u7",
    name: "能源研究员",
    avatar: "/energy-researcher-avatar.jpg",
    rank: 7,
    points: 6890,
    weeklyPoints: 220,
    contributions: 98,
    streak: 12,
    badges: 4,
    trend: "down",
    isVerified: false,
  },
  {
    id: "u8",
    name: "神经科学家",
    avatar: "/neuroscientist-avatar.jpg",
    rank: 8,
    points: 5670,
    weeklyPoints: 180,
    contributions: 87,
    streak: 9,
    badges: 4,
    trend: "up",
    isVerified: true,
  },
  {
    id: "u9",
    name: "航天工程师",
    avatar: "/aerospace-engineer-avatar.jpg",
    rank: 9,
    points: 4980,
    weeklyPoints: 150,
    contributions: 76,
    streak: 7,
    badges: 3,
    trend: "same",
    isVerified: false,
  },
  {
    id: "u10",
    name: "区块链专家",
    avatar: "/blockchain-expert-avatar.jpg",
    rank: 10,
    points: 4320,
    weeklyPoints: 120,
    contributions: 65,
    streak: 5,
    badges: 3,
    trend: "down",
    isVerified: false,
  },
]

const pointsRules = [
  { action: "创建词条", points: "+50", icon: BookOpen },
  { action: "词条被收录为精选", points: "+100", icon: Award },
  { action: "发表评论", points: "+5", icon: MessageCircle },
  { action: "评论被点赞", points: "+2", icon: Star },
  { action: "每日签到", points: "+10~45", icon: Calendar },
  { action: "邀请好友注册", points: "+100", icon: TrendingUp },
]

const allBadges = [
  { id: "b1", name: "新手上路", icon: "🌱", description: "完成注册", requirement: "注册账号" },
  { id: "b2", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条", requirement: "贡献10个词条" },
  { id: "b3", name: "活跃达人", icon: "🔥", description: "连续签到7天", requirement: "连续签到7天" },
  { id: "b4", name: "精选作者", icon: "⭐", description: "词条被收录为精选", requirement: "1个精选词条" },
  { id: "b5", name: "评论专家", icon: "💬", description: "发表100条评论", requirement: "发表100条评论" },
  { id: "b6", name: "人气达人", icon: "❤️", description: "获得1000个点赞", requirement: "获得1000点赞" },
  { id: "b7", name: "知识大师", icon: "🎓", description: "贡献超过50个词条", requirement: "贡献50个词条" },
  { id: "b8", name: "社区元老", icon: "👑", description: "注册超过1年", requirement: "注册满1年" },
]

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
  if (rank === 2) return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
  if (rank === 3) return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
  return <span className="text-base sm:text-lg font-bold text-muted-foreground">{rank}</span>
}

function getTrendIcon(trend?: string) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
  if (trend === "down") return <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 rotate-180" />
  return null
}

export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly" | "all">("weekly")
  const [activeTab, setActiveTab] = useState<"contributions" | "points" | "streak">("contributions")
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [activeTab, timeRange])

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    try {
      const response = await apiGet<{ users: any[] }>(
        `/leaderboard?type=${activeTab}&timeRange=${timeRange}&limit=100`
      )
      if (response.data) {
        setUsers(response.data.users)
      }
    } catch (err) {
      console.error("Fetch leaderboard error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const top3 = users.slice(0, 3)

  return (
    <PageLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">排行榜</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">贡献知识，获取积分，攀登排行榜顶峰</p>
        </div>

        {/* Top 3 Podium */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <h2 className="font-semibold text-foreground mb-4 sm:mb-6 text-center text-sm sm:text-base">
            本周贡献榜 TOP 3
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : top3.length >= 3 ? (
            <div className="flex items-end justify-center gap-2 sm:gap-4">
              {/* Second Place */}
              <div className="flex flex-col items-center">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 sm:border-4 border-gray-300">
                  <AvatarImage src={top3[1]?.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{top3[1]?.name[0]}</AvatarFallback>
                </Avatar>
                <div className="w-16 sm:w-20 h-16 sm:h-24 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg mt-2 flex flex-col items-center justify-end pb-2">
                  <Medal className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500" />
                  <span className="text-base sm:text-xl font-bold text-gray-700">2</span>
                </div>
                <p className="text-xs sm:text-sm font-medium mt-1 sm:mt-2 text-center truncate w-16 sm:w-20">
                  {top3[1]?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {top3[1]?.weeklyPoints || top3[1]?.points || top3[1]?.streak || 0}
                </p>
              </div>

              {/* First Place */}
              <div className="flex flex-col items-center -mt-2 sm:-mt-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 sm:border-4 border-yellow-400 ring-2 sm:ring-4 ring-yellow-200">
                  <AvatarImage src={top3[0]?.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{top3[0]?.name[0]}</AvatarFallback>
                </Avatar>
                <div className="w-20 sm:w-24 h-24 sm:h-32 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg mt-2 flex flex-col items-center justify-end pb-2">
                  <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                  <span className="text-xl sm:text-2xl font-bold text-yellow-700">1</span>
                </div>
                <p className="text-xs sm:text-sm font-medium mt-1 sm:mt-2 text-center truncate w-20 sm:w-24">
                  {top3[0]?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {top3[0]?.weeklyPoints || top3[0]?.points || top3[0]?.streak || 0}
                </p>
              </div>

              {/* Third Place */}
              <div className="flex flex-col items-center">
                <Avatar className="h-10 w-10 sm:h-14 sm:w-14 border-2 sm:border-4 border-amber-500">
                  <AvatarImage src={top3[2]?.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{top3[2]?.name[0]}</AvatarFallback>
                </Avatar>
                <div className="w-14 sm:w-18 h-14 sm:h-20 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg mt-2 flex flex-col items-center justify-end pb-2">
                  <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />
                  <span className="text-sm sm:text-lg font-bold text-amber-800">3</span>
                </div>
                <p className="text-xs sm:text-sm font-medium mt-1 sm:mt-2 text-center truncate w-14 sm:w-18">
                  {top3[2]?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {top3[2]?.weeklyPoints || top3[2]?.points || top3[2]?.streak || 0}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">暂无数据</p>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-3 sm:space-y-4">
          {/* Tabs List */}
          <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto">
            <TabsTrigger value="contributions" className="gap-1.5 text-xs sm:text-sm">
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              贡献榜
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-1.5 text-xs sm:text-sm">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              积分榜
            </TabsTrigger>
            <TabsTrigger value="streak" className="gap-1.5 text-xs sm:text-sm">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              签到榜
            </TabsTrigger>
          </TabsList>

          {/* Time Range Filter */}
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              variant={timeRange === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("weekly")}
              className={`text-xs sm:text-sm ${timeRange !== "weekly" ? "bg-transparent" : ""}`}
            >
              本周
            </Button>
            <Button
              variant={timeRange === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("monthly")}
              className={`text-xs sm:text-sm ${timeRange !== "monthly" ? "bg-transparent" : ""}`}
            >
              本月
            </Button>
            <Button
              variant={timeRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("all")}
              className={`text-xs sm:text-sm ${timeRange !== "all" ? "bg-transparent" : ""}`}
            >
              总榜
            </Button>
          </div>

          {/* Tabs Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="contributions" className="space-y-2">
                {users.map((user, index) => (
                  <Link
                    key={user.id}
                    href={`/user/${user.id}`}
                    className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="w-6 sm:w-8 flex justify-center shrink-0">{getRankIcon(user.rank || index + 1)}</div>
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-medium text-foreground text-sm sm:text-base truncate">{user.name}</span>
                        {user.isVerified && (
                          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                            认证
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {user.contributions}
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {user.badges} 徽章
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-foreground text-sm sm:text-base">
                          {user.weeklyPoints || user.monthlyPoints || user.contributions}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {timeRange === "weekly" ? "本周" : timeRange === "monthly" ? "本月" : "总计"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 hidden sm:block" />
                  </Link>
                ))}
              </TabsContent>

              <TabsContent value="points" className="space-y-2">
                {users.map((user, index) => (
                  <Link
                    key={user.id}
                    href={`/user/${user.id}`}
                    className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="w-6 sm:w-8 flex justify-center shrink-0">{getRankIcon(index + 1)}</div>
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground text-sm sm:text-base truncate block">{user.name}</span>
                      <p className="text-xs text-muted-foreground">Lv.{user.level || 1}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                        <span className="font-semibold text-foreground text-sm sm:text-base">
                          {user.points?.toLocaleString() || 0}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:block">总积分</span>
                    </div>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 hidden sm:block" />
                  </Link>
                ))}
              </TabsContent>

              <TabsContent value="streak" className="space-y-2">
                {users.map((user, index) => (
                  <Link
                    key={user.id}
                    href={`/user/${user.id}`}
                    className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="w-6 sm:w-8 flex justify-center shrink-0">{getRankIcon(index + 1)}</div>
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground text-sm sm:text-base truncate block">{user.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                        <span className="font-semibold text-foreground text-sm sm:text-base">{user.streak || 0} 天</span>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:block">连续签到</span>
                    </div>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 hidden sm:block" />
                  </Link>
                ))}
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Points Rules */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <h2 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            积分规则
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {pointsRules.map((rule) => {
              const IconComponent = rule.icon
              return (
                <div key={rule.action} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{rule.action}</p>
                    <p className="text-xs sm:text-sm text-primary font-semibold">{rule.points}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Badges Collection */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <h2 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            徽章图鉴
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {allBadges.map((badge) => (
              <div key={badge.id} className="p-3 sm:p-4 bg-muted/30 rounded-lg text-center">
                <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{badge.icon}</div>
                <p className="font-medium text-foreground text-xs sm:text-sm">{badge.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">{badge.requirement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
