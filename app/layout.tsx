import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_SC } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _notoSansSC = Noto_Sans_SC({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "高能百科 - 前沿知识探索平台",
  description: "汇聚各领域前沿知识、高新名词的专业百科平台，快速收录最新科技、学术、行业前沿概念",
  generator: "v0.app",
  keywords: ["百科", "科技", "人工智能", "量子计算", "生物科技", "前沿知识"],
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
