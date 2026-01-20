"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Search,
  Menu,
  Zap,
  Bell,
  PenSquare,
  Home,
  Compass,
  BookOpen,
  Users,
  FileText,
  LogIn,
  LogOut,
  User,
  Settings,
  Star,
  Trophy,
  Shield,
  Sun,
  Moon,
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
import { useAuth } from "@/lib/auth-context"
import { MobileSidebarDrawer } from "@/components/mobile-sidebar-drawer"

const navItems = [
  { label: "首页", href: "/", icon: Home },
  { label: "发现", href: "/discover", icon: Compass },
  { label: "词条库", href: "/terms", icon: BookOpen },
  { label: "论文", href: "/papers", icon: FileText },
  { label: "社区", href: "/community", icon: Users },
]

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user, logout, hasAnyPermission } = useAuth()
  const { theme, setTheme } = useTheme()
  
  // 检查是否是管理员（有后台访问权限）
  const isAdmin = user && hasAnyPermission(['admin.dashboard.view', 'admin.stats.view'])
  
  // 确保客户端渲染后再显示主题切换按钮
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setMobileSearchOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center gap-2 sm:gap-4">
          <MobileSidebarDrawer>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </MobileSidebarDrawer>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:block">高能百科</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <IconComponent className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索词条、论文或领域..."
                className="w-full pl-9 h-9 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden shrink-0"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Right Actions - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* 主题切换按钮 */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
            
            {user ? (
              <>
                <Link href="/leaderboard">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Trophy className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                  </Button>
                </Link>
                <Link href="/create">
                  <Button size="sm" className="gap-2">
                    <PenSquare className="h-4 w-4" />
                    创建词条
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs font-medium text-muted-foreground">{user.points}</span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{user.points} 积分</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Lv.{user.level}</div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        个人主页
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks" className="gap-2 cursor-pointer">
                        <Star className="h-4 w-4" />
                        我的收藏
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        设置
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="gap-2 cursor-pointer">
                            <Shield className="h-4 w-4" />
                            管理后台
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">注册</Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1">
            {/* 移动端主题切换按钮 */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
            
            {user ? (
              <>
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-full hover:bg-muted transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{user.name[0]}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">{user.points} 积分</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        个人主页
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/create" className="gap-2 cursor-pointer">
                        <PenSquare className="h-4 w-4" />
                        创建词条
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        设置
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="gap-2 cursor-pointer">
                            <Shield className="h-4 w-4" />
                            管理后台
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" className="h-8 px-3">
                  登录
                </Button>
              </Link>
            )}
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="sm:hidden pb-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索词条、论文或领域..."
                  className="w-full pl-9 h-10 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
