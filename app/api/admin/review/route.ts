import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { query, execute } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.review.view')
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "all" // term, paper, all
    const status = searchParams.get("status") || "pending" // pending, rejected
    const limit = parseInt(searchParams.get("limit") || "20")

    const items: any[] = []

    // 获取待审核或被拒绝的词条
    if (type === "all" || type === "term") {
      const terms = await query<any>(
        `SELECT 
          t.id,
          t.title,
          t.summary,
          t.content,
          t.created_at,
          t.status,
          c.label as category_label,
          u.id as author_id,
          u.name as author_name,
          u.avatar as author_avatar
        FROM terms t
        INNER JOIN categories c ON t.category_id = c.id
        INNER JOIN users u ON t.author_id = u.id
        WHERE t.status = ?
        ORDER BY t.created_at DESC
        LIMIT ?`,
        [status, limit]
      )

      items.push(
        ...terms.map((term: any) => ({
          id: term.id.toString(),
          type: "term",
          title: term.title,
          summary: term.summary,
          content: term.content,
          category: term.category_label,
          author: {
            name: term.author_name,
            avatar: term.author_avatar || "/placeholder-user.jpg",
          },
          submittedAt: formatRelativeTime(term.created_at),
          wordCount: term.content ? term.content.length : 0,
        }))
      )
    }

    // 获取待审核或被拒绝的论文
    // 注意：papers 表没有 author_id，需要通过 paper_authors 表获取作者
    if (type === "all" || type === "paper") {
      // 先获取待审核或被拒绝的论文基本信息
      const papers = await query<any>(
        `SELECT 
          p.id,
          p.title,
          p.abstract,
          p.journal,
          p.created_at,
          p.status,
          c.label as category_label
        FROM papers p
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.status = ?
        ORDER BY p.created_at DESC
        LIMIT ?`,
        [status, limit]
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
        items.push(
          ...papers.map((paper: any) => {
            const author = authorMap.get(paper.id) || {
              author_name: "未知作者",
              author_avatar: "/placeholder-user.jpg",
            }
            return {
              id: paper.id.toString(),
              type: "paper",
              title: paper.title,
              summary: paper.abstract,
              journal: paper.journal,
              category: paper.category_label,
              author: {
                name: author.author_name,
                avatar: author.author_avatar,
              },
              submittedAt: formatRelativeTime(paper.created_at),
            }
          })
        )
      }
    }

    // 按提交时间排序
    items.sort((a, b) => {
      // 简化排序，实际应该解析时间
      return 0
    })

    return NextResponse.json({ items })
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

    console.error("Get review items error:", error)
    return NextResponse.json(
      { error: "获取待审核内容失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, action, reason } = body // action: approve, reject
    
    // 根据操作类型检查不同权限
    const permission = action === 'approve' ? 'admin.review.approve' : 'admin.review.reject'
    const authUser = await requirePermission(request, permission)

    if (!id || !type || !action) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      )
    }

    if (type === "term") {
      if (action === "approve") {
        await execute("UPDATE terms SET status = 'published' WHERE id = ?", [id])
      } else if (action === "reject") {
        await execute("UPDATE terms SET status = 'rejected' WHERE id = ?", [id])
        // 可以在这里保存拒绝原因（如果有相关字段）
      }
    } else if (type === "paper") {
      if (action === "approve") {
        await execute("UPDATE papers SET status = 'published' WHERE id = ?", [id])
      } else if (action === "reject") {
        await execute("UPDATE papers SET status = 'rejected' WHERE id = ?", [id])
      }
    }

    return NextResponse.json({
      message: action === "approve" ? "审核通过" : "审核拒绝",
    })
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

    console.error("Review action error:", error)
    return NextResponse.json(
      { error: "审核操作失败" },
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
