import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { MainFeed } from "@/components/main-feed"
import { RightSidebar } from "@/components/right-sidebar"
import { MobileNav } from "@/components/mobile-nav"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-16">
        <div className="flex gap-6 py-6 pb-24 md:pb-6">
          {/* 左侧分类导航 */}
          <aside className="hidden lg:block w-56 shrink-0">
            <LeftSidebar />
          </aside>

          {/* 主内容区 - 词条信息流 */}
          <main className="flex-1 min-w-0">
            <MainFeed />
          </main>

          {/* 右侧边栏 - 热门话题 */}
          <aside className="hidden xl:block w-72 shrink-0">
            <RightSidebar />
          </aside>
        </div>
      </div>
      {/* 移动端底部导航 */}
      <MobileNav />
    </div>
  )
}
