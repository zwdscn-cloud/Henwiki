"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  Bell,
  ChevronLeft,
  Menu,
  LogOut,
  Search,
  Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Suspense } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

const sidebarItems = [
  { label: "仪表盘", href: "/admin", icon: LayoutDashboard, permission: "admin.dashboard.view" },
  { label: "词条管理", href: "/admin/terms", icon: FileText, badge: 12, permission: "admin.terms.view" },
  { label: "论文管理", href: "/admin/papers", icon: BookOpen, badge: 5, permission: "admin.papers.view" },
  { label: "用户管理", href: "/admin/users", icon: Users, permission: "admin.users.view" },
  { label: "评论管理", href: "/admin/comments", icon: MessageSquare, badge: 23, permission: "admin.comments.view" },
  { label: "广告管理", href: "/admin/ads", icon: Megaphone, permission: "admin.ads.view" },
  { label: "数据分析", href: "/admin/analytics", icon: BarChart3, permission: "admin.analytics.view" },
  { label: "审核中心", href: "/admin/review", icon: Shield, badge: 8, permission: "admin.review.view" },
  { label: "系统设置", href: "/admin/settings", icon: Settings, permission: "admin.settings.view" },
  { label: "角色管理", href: "/admin/roles", icon: Shield, permission: "admin.roles.view" },
]

function SidebarContent({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { hasPermission, hasAnyPermission } = useAuth()

  // 根据权限过滤菜单项
  const visibleItems = sidebarItems.filter(item => {
    if (!item.permission) return true
    // 临时调试：如果权限检查失败，也显示广告管理菜单
    if (item.permission === 'admin.ads.view') {
      // 如果用户有管理员权限，就显示广告管理
      const hasAdminAccess = hasAnyPermission(['admin.dashboard.view', 'admin.stats.view'])
      if (hasAdminAccess) return true
    }
    return hasPermission(item.permission)
  })

  return (
    <nav className="space-y-1 p-2">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
        const IconComponent = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <IconComponent className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant={isActive ? "secondary" : "destructive"} className="h-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading: authLoading, hasAnyPermission } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // 等待认证状态加载完成
    if (authLoading) return

    // 如果未登录，跳转到登录页
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // 检查是否有后台访问权限
    if (!hasAnyPermission(['admin.dashboard.view', 'admin.stats.view'])) {
      router.push('/?error=admin_required')
      return
    }
  }, [user, authLoading, router, pathname, hasAnyPermission])

  // 如果正在加载认证状态或未登录，显示加载中
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 如果没有后台访问权限，显示错误提示
  if (!hasAnyPermission(['admin.dashboard.view', 'admin.stats.view'])) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">权限不足，需要后台访问权限才能访问管理页面</p>
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300 hidden md:block",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!sidebarCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">高能</span>
              </div>
              <span className="font-semibold">管理后台</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <SidebarContent collapsed={sidebarCollapsed} />

        {/* Back to site */}
        <div className="absolute bottom-4 left-0 right-0 px-2">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "justify-center",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
            {!sidebarCollapsed && <span>返回前台</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "md:ml-16" : "md:ml-64")}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex h-16 items-center border-b border-border px-4">
                  <Link href="/admin" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <span className="text-sm font-bold text-primary-foreground">高能</span>
                    </div>
                    <span className="font-semibold">管理后台</span>
                  </Link>
                </div>
                <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
                <div className="absolute bottom-4 left-0 right-0 px-2">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span>返回前台</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="全局搜索..." className="w-40 md:w-64 pl-9" />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                    5
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 md:w-80">
                <div className="p-2 font-medium">通知</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <span className="font-medium">新词条待审核</span>
                  <span className="text-xs text-muted-foreground">用户提交了「量子纠缠」词条 · 5分钟前</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <span className="font-medium">评论被举报</span>
                  <span className="text-xs text-muted-foreground">有用户举报了一条违规评论 · 30分钟前</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/admin-avatar.jpg" />
                    <AvatarFallback>管</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">管理员</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  账号设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}
