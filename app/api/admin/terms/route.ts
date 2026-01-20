import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { query, execute } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.terms.view')
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const status = searchParams.get("status") || "all"
    const categoryId = searchParams.get("categoryId")
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * pageSize
    const conditions: string[] = []
    const params: any[] = []

    if (status !== "all") {
      conditions.push("t.status = ?")
      params.push(status)
    }

    if (categoryId) {
      conditions.push("t.category_id = ?")
      params.push(parseInt(categoryId))
    }

    if (search) {
      conditions.push("(t.title LIKE ? OR t.summary LIKE ?)")
      params.push(`%${search}%`, `%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // 获取总数
    const [totalResult] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM terms t ${whereClause}`,
      params
    )

    // 获取词条列表
    const terms = await query<any>(
      `SELECT 
        t.id,
        t.title,
        t.summary,
        t.status,
        t.views,
        t.likes_count,
        t.comments_count,
        t.created_at,
        t.updated_at,
        c.label as category_label,
        c.slug as category_slug,
        u.id as author_id,
        u.name as author_name,
        u.avatar as author_avatar
      FROM terms t
      INNER JOIN categories c ON t.category_id = c.id
      INNER JOIN users u ON t.author_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    return NextResponse.json({
      terms,
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

    console.error("Get admin terms error:", error)
    return NextResponse.json(
      { error: "获取词条列表失败" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body
    
    // 根据操作类型检查不同权限
    let permission = 'admin.terms.edit'
    if (status === 'published') {
      permission = 'admin.terms.approve'
    } else if (status === 'rejected') {
      permission = 'admin.terms.reject'
    }
    const authUser = await requirePermission(request, permission)

    if (!id || !status) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      )
    }

    await execute(
      "UPDATE terms SET status = ? WHERE id = ?",
      [status, id]
    )

    return NextResponse.json({
      message: "词条状态更新成功",
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

    console.error("Update term status error:", error)
    return NextResponse.json(
      { error: "更新词条状态失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.terms.delete')
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "缺少词条ID" },
        { status: 400 }
      )
    }

    await execute("DELETE FROM terms WHERE id = ?", [id])

    return NextResponse.json({
      message: "词条删除成功",
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

    console.error("Delete term error:", error)
    return NextResponse.json(
      { error: "删除词条失败" },
      { status: 500 }
    )
  }
}
