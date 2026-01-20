import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { query, execute } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.comments.view')
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * pageSize
    const conditions: string[] = []
    const params: any[] = []

    // 注意：comments 表没有 status 字段，这里先忽略
    // 可以通过其他方式标记评论状态（如通过 likes_count 或其他字段）

    if (search) {
      conditions.push("c.content LIKE ?")
      params.push(`%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // 获取总数
    const [totalResult] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM comments c ${whereClause}`,
      params
    )

    // 获取评论列表
    const comments = await query<any>(
      `SELECT 
        c.id,
        c.content,
        c.likes_count,
        c.created_at,
        c.updated_at,
        c.term_id,
        u.id as author_id,
        u.name as author_name,
        u.avatar as author_avatar,
        t.title as term_title
      FROM comments c
      INNER JOIN users u ON c.author_id = u.id
      LEFT JOIN terms t ON c.term_id = t.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    return NextResponse.json({
      comments,
      pagination: {
        page,
        pageSize,
        total: totalResult[0]?.count || 0,
      },
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

    console.error("Get admin comments error:", error)
    return NextResponse.json(
      { error: "获取评论列表失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.comments.delete')
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "缺少评论ID" },
        { status: 400 }
      )
    }

    // 获取评论的 term_id 以便更新评论数
    const comment = await query<any>(
      "SELECT term_id FROM comments WHERE id = ?",
      [id]
    )

    if (comment.length > 0) {
      const termId = comment[0].term_id
      // 删除评论
      await execute("DELETE FROM comments WHERE id = ?", [id])
      // 更新词条的评论数
      await execute(
        "UPDATE terms SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ?",
        [termId]
      )
    } else {
      await execute("DELETE FROM comments WHERE id = ?", [id])
    }

    return NextResponse.json({
      message: "评论删除成功",
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

    console.error("Delete comment error:", error)
    return NextResponse.json(
      { error: "删除评论失败" },
      { status: 500 }
    )
  }
}
