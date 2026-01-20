"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, BookOpen, FileText, User, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

const navItems = [
  { label: "首页", href: "/", icon: Home },
  { label: "发现", href: "/discover", icon: Compass },
  { label: "创建", href: "/create", icon: PlusCircle, highlight: true },
  { label: "论文", href: "/papers", icon: FileText },
  { label: "我的", href: "/profile", icon: User, authHref: "/login" },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // 不在 admin、login、register、checkout 等全屏页面显示
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/onboarding")
  ) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* 背景模糊效果 */}
      <div className="absolute inset-0 bg-card/95 backdrop-blur-lg border-t border-border" />
      
      <div className="relative flex items-end justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        {navItems.map((item) => {
          const IconComponent = item.icon
          const href = item.authHref && !user ? item.authHref : item.href
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          // 中间的创建按钮特殊样式
          if (item.highlight) {
            return (
              <Link
                key={item.label}
                href={user ? href : "/login"}
                className="flex flex-col items-center -mt-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                  <IconComponent className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] mt-1 text-primary font-medium">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-all active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-7 w-7 rounded-lg transition-colors",
                isActive && "bg-primary/10"
              )}>
                <IconComponent className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              </div>
              <span className={cn(
                "text-[10px]",
                isActive && "font-medium"
              )}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
