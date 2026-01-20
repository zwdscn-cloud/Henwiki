"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Cpu,
  Dna,
  Atom,
  Brain,
  Rocket,
  Leaf,
  Globe,
  Wallet,
  Shield,
  TrendingUp,
  Clock,
  Bookmark,
  FileText,
  Upload,
  Zap,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const categories = [
  { label: "人工智能", href: "/category/ai", icon: Brain, count: 1234 },
  { label: "生物科技", href: "/category/biotech", icon: Dna, count: 856 },
  { label: "量子计算", href: "/category/quantum", icon: Atom, count: 423 },
  { label: "航天科技", href: "/category/space", icon: Rocket, count: 567 },
  { label: "新能源", href: "/category/energy", icon: Leaf, count: 789 },
  { label: "芯片半导体", href: "/category/semiconductor", icon: Cpu, count: 645 },
  { label: "元宇宙", href: "/category/metaverse", icon: Globe, count: 334 },
  { label: "区块链", href: "/category/blockchain", icon: Wallet, count: 521 },
  { label: "网络安全", href: "/category/security", icon: Shield, count: 412 },
]

const quickLinks = [
  { label: "热门词条", href: "/trending", icon: TrendingUp },
  { label: "最新收录", href: "/latest", icon: Clock },
  { label: "我的收藏", href: "/bookmarks", icon: Bookmark },
]

const paperLinks = [
  { label: "论文库", href: "/papers", icon: FileText },
  { label: "提交论文", href: "/papers/submit", icon: Upload },
]

interface MobileSidebarDrawerProps {
  children: React.ReactNode
}

export function MobileSidebarDrawer({ children }: MobileSidebarDrawerProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span>高能百科</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="space-y-4 p-4">
            {/* Quick Links */}
            <div className="space-y-1">
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">快捷入口</h3>
              {quickLinks.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Papers */}
            <div className="space-y-1">
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">学术论文</h3>
              {paperLinks.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Categories */}
            <div className="space-y-1">
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">领域分类</h3>
              {categories.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4" />
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.count}</span>
                  </Link>
                )
              })}
            </div>

            {/* Footer Links */}
            <div className="border-t border-border pt-4">
              <div className="flex flex-wrap gap-3 px-2 text-xs text-muted-foreground">
                <Link href="/about" className="hover:text-foreground" onClick={() => setOpen(false)}>
                  关于
                </Link>
                <Link href="/help" className="hover:text-foreground" onClick={() => setOpen(false)}>
                  帮助
                </Link>
                <Link href="/terms-of-service" className="hover:text-foreground" onClick={() => setOpen(false)}>
                  条款
                </Link>
                <Link href="/privacy" className="hover:text-foreground" onClick={() => setOpen(false)}>
                  隐私
                </Link>
              </div>
              <p className="mt-2 px-2 text-xs text-muted-foreground">© 2026 高能百科</p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
