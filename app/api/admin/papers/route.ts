import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { query, execute } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.papers.view')
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
      conditions.push("p.status = ?")
      params.push(status)
    }

    if (categoryId) {
      conditions.push("p.category_id = ?")
      params.push(parseInt(categoryId))
    }

    if (search) {
      conditions.push("(p.title LIKE ? OR p.abstract LIKE ?)")
      params.push(`%${search}%`, `%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // 获取总数
    const [totalResult] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM papers p ${whereClause}`,
      params
    )

    // 获取论文列表
    const papers = await query<any>(
      `SELECT 
        p.id,
        p.title,
        p.title_cn,
        p.abstract,
        p.status,
        p.views,
        p.downloads,
        p.likes_count,
        p.citations,
        p.journal,
        p.publish_date,
        p.created_at,
        p.updated_at,
        c.label as category_label,
        c.slug as category_slug,
        u.id as author_id,
        u.name as author_name,
        u.avatar as author_avatar
      FROM papers p
      INNER JOIN categories c ON p.category_id = c.id
      INNER JOIN users u ON p.author_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    // 获取每篇论文的作者
    const paperIds = papers.map((p: any) => p.id)
    const authorsMap = new Map<number, any[]>()

    if (paperIds.length > 0) {
      const placeholders = paperIds.map(() => "?").join(",")
      const authors = await query<any>(
        `SELECT paper_id, name, affiliation 
         FROM paper_authors 
         WHERE paper_id IN (${placeholders})
         ORDER BY paper_id, id`,
        paperIds
      )

      authors.forEach((author: any) => {
        if (!authorsMap.has(author.paper_id)) {
          authorsMap.set(author.paper_id, [])
        }
        authorsMap.get(author.paper_id)!.push({
          name: author.name,
          affiliation: author.affiliation,
        })
      })
    }

    const papersWithAuthors = papers.map((paper: any) => ({
      ...paper,
      authors: authorsMap.get(paper.id) || [],
    }))

    return NextResponse.json({
      papers: papersWithAuthors,
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

    console.error("Get admin papers error:", error)
    return NextResponse.json(
      { error: "获取论文列表失败" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, isHighlighted } = body
    
    // 根据操作类型检查不同权限
    let permission = 'admin.papers.edit'
    if (status === 'published') {
      permission = 'admin.papers.approve'
    } else if (status === 'rejected') {
      permission = 'admin.papers.reject'
    }
    const authUser = await requirePermission(request, permission)

    if (!id) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      )
    }

    const updates: string[] = []
    const params: any[] = []

    if (status) {
      updates.push("status = ?")
      params.push(status)
    }

    if (isHighlighted !== undefined) {
      updates.push("is_highlighted = ?")
      params.push(isHighlighted)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "没有要更新的字段" },
        { status: 400 }
      )
    }

    params.push(id)
    await execute(
      `UPDATE papers SET ${updates.join(", ")} WHERE id = ?`,
      params
    )

    return NextResponse.json({
      message: "论文更新成功",
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

    console.error("Update paper error:", error)
    return NextResponse.json(
      { error: "更新论文失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.papers.delete')
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "缺少论文ID" },
        { status: 400 }
      )
    }

    await execute("DELETE FROM papers WHERE id = ?", [id])

    return NextResponse.json({
      message: "论文删除成功",
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

    console.error("Delete paper error:", error)
    return NextResponse.json(
      { error: "删除论文失败" },
      { status: 500 }
    )
  }
}
