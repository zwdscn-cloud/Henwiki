import type React from "react"
import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import { MobileNav } from "@/components/mobile-nav"

interface PageLayoutProps {
  children: React.ReactNode
  showRightSidebar?: boolean
  showLeftSidebar?: boolean
}

export function PageLayout({ children, showRightSidebar = true, showLeftSidebar = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-16">
        <div className="flex gap-6 py-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
          {showLeftSidebar && (
            <aside className="hidden lg:block w-56 shrink-0">
              <LeftSidebar />
            </aside>
          )}
          <main className="flex-1 min-w-0">{children}</main>
          {showRightSidebar && (
            <aside className="hidden xl:block w-72 shrink-0">
              <RightSidebar />
            </aside>
          )}
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
