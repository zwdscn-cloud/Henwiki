import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { query } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.review.view')
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10")

    console.log("[GET /admin/pending] Fetching pending items, limit:", limit)

    // 获取待审核的词条
    let pendingTerms: any[] = []
    try {
      pendingTerms = await query<any>(
        `SELECT 
          t.id,
          t.title,
          t.created_at,
          t.status,
          u.id as author_id,
          u.name as author_name,
          u.avatar as author_avatar,
          c.label as category_label,
          'term' as type
        FROM terms t
        INNER JOIN users u ON t.author_id = u.id
        INNER JOIN categories c ON t.category_id = c.id
        WHERE t.status = 'pending'
        ORDER BY t.created_at DESC
        LIMIT ?`,
        [limit]
      )
      console.log("[GET /admin/pending] Found pending terms:", pendingTerms.length)
    } catch (termsError: any) {
      console.error("[GET /admin/pending] Error fetching pending terms:", termsError)
      // 如果词条查询失败，继续尝试获取论文
    }

    // 获取待审核的论文
    // 注意：papers 表没有 author_id，需要通过 paper_authors 表获取作者
    let pendingPapers: any[] = []
    try {
      // 先获取待审核的论文基本信息
      const papers = await query<any>(
        `SELECT 
          p.id,
          p.title,
          p.created_at,
          p.status,
          c.label as category_label
        FROM papers p
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC
        LIMIT ?`,
        [limit]
      )

      // 如果有论文，获取每个论文的第一个作者（order_index = 0）
      if (papers.length > 0) {
        const paperIds = papers.map((p: any) => p.id)
        const placeholders = paperIds.map(() => "?").join(",")
        
        // 获取每个论文的第一个作者信息
        const firstAuthors = await query<any>(
          `SELECT 
            pa.paper_id,
            pa.name as author_name,
            '' as author_avatar,
            pa.order_index
          FROM paper_authors pa
          WHERE pa.paper_id IN (${placeholders})
          AND pa.order_index = 0
          ORDER BY pa.paper_id`,
          paperIds
        )

        // 创建作者映射
        const authorMap = new Map<number, any>()
        firstAuthors.forEach((author: any) => {
          authorMap.set(author.paper_id, {
            author_name: author.author_name,
            author_avatar: author.author_avatar || "/placeholder-user.jpg",
          })
        })

        // 合并论文和作者信息
        pendingPapers = papers.map((paper: any) => {
          const author = authorMap.get(paper.id) || {
            author_name: "未知作者",
            author_avatar: "/placeholder-user.jpg",
          }
          return {
            ...paper,
            author_id: null, // papers 表没有 author_id
            author_name: author.author_name,
            author_avatar: author.author_avatar,
            type: "paper",
          }
        })
      }
      
      console.log("[GET /admin/pending] Found pending papers:", pendingPapers.length)
    } catch (papersError: any) {
      console.error("[GET /admin/pending] Error fetching pending papers:", papersError)
      // 如果论文查询失败，继续处理已有的词条数据
    }

    // 合并并格式化数据
    const pendingItems = [
      ...pendingTerms.map((item: any) => ({
        id: item.id.toString(),
        type: "term",
        title: item.title,
        author: item.author_name,
        avatar: item.author_avatar || "/placeholder-user.jpg",
        category: item.category_label,
        submittedAt: formatRelativeTime(item.created_at),
      })),
      ...pendingPapers.map((item: any) => ({
        id: item.id.toString(),
        type: "paper",
        title: item.title,
        author: item.author_name,
        avatar: item.author_avatar || "/placeholder-user.jpg",
        category: item.category_label,
        submittedAt: formatRelativeTime(item.created_at),
      })),
    ].sort((a, b) => {
      // 按提交时间排序（需要解析时间，这里简化处理）
      return 0
    })

    return NextResponse.json({ items: pendingItems })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "权限不足，需要管理员权限" },
        { status: 403 }
      )
    }

    console.error("Get pending items error:", error)
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        error: "获取待审核内容失败",
        message: error.message || "获取待审核内容失败",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    return `${days}天前`
  }
}
