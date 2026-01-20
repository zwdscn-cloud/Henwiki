import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { query, execute } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.ads.view')
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const status = searchParams.get("status") || "all"
    const variant = searchParams.get("variant") || "all"
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * pageSize
    const conditions: string[] = []
    const params: any[] = []

    if (status !== "all") {
      conditions.push("a.status = ?")
      params.push(status)
    }

    if (variant !== "all") {
      conditions.push("a.variant = ?")
      params.push(variant)
    }

    if (search) {
      conditions.push("(a.title LIKE ? OR a.description LIKE ? OR a.sponsor LIKE ?)")
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // 获取总数
    const [totalResult] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM ads a ${whereClause}`,
      params
    )

    // 获取广告列表
    const ads = await query<any>(
      `SELECT 
        a.id,
        a.title,
        a.description,
        a.image,
        a.url,
        a.sponsor,
        a.cta,
        a.tag,
        a.variant,
        a.type,
        a.gradient,
        a.status,
        a.priority,
        a.start_date,
        a.end_date,
        a.click_count,
        a.view_count,
        a.created_at,
        a.updated_at,
        u.id as creator_id,
        u.name as creator_name
      FROM ads a
      LEFT JOIN users u ON a.created_by = u.id
      ${whereClause}
      ORDER BY a.priority DESC, a.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    return NextResponse.json({
      ads,
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

    console.error("Get admin ads error:", error)
    return NextResponse.json(
      { error: "获取广告列表失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.ads.create')
    const body = await request.json()
    const {
      title,
      description,
      image,
      url,
      sponsor,
      cta,
      tag,
      variant,
      type,
      gradient,
      status,
      priority,
      start_date,
      end_date,
    } = body

    if (!title || !url || !variant) {
      return NextResponse.json(
        { error: "缺少必要参数：标题、链接和类型为必填项" },
        { status: 400 }
      )
    }

    const result = await execute(
      `INSERT INTO ads (
        title, description, image, url, sponsor, cta, tag, variant, type, gradient,
        status, priority, start_date, end_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        image || '',
        url,
        sponsor || '',
        cta || '了解详情',
        tag || '',
        variant,
        type || '',
        gradient || '',
        status || 'draft',
        priority || 0,
        start_date || null,
        end_date || null,
        authUser.id,
      ]
    )

    return NextResponse.json({
      message: "广告创建成功",
      id: result.insertId,
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

    console.error("Create ad error:", error)
    return NextResponse.json(
      { error: "创建广告失败" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.ads.edit')
    const body = await request.json()
    const {
      id,
      title,
      description,
      image,
      url,
      sponsor,
      cta,
      tag,
      variant,
      type,
      gradient,
      status,
      priority,
      start_date,
      end_date,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: "缺少广告ID" },
        { status: 400 }
      )
    }

    if (!title || !url || !variant) {
      return NextResponse.json(
        { error: "缺少必要参数：标题、链接和类型为必填项" },
        { status: 400 }
      )
    }

    await execute(
      `UPDATE ads SET
        title = ?,
        description = ?,
        image = ?,
        url = ?,
        sponsor = ?,
        cta = ?,
        tag = ?,
        variant = ?,
        type = ?,
        gradient = ?,
        status = ?,
        priority = ?,
        start_date = ?,
        end_date = ?
      WHERE id = ?`,
      [
        title,
        description || null,
        image || '',
        url,
        sponsor || '',
        cta || '了解详情',
        tag || '',
        variant,
        type || '',
        gradient || '',
        status || 'draft',
        priority || 0,
        start_date || null,
        end_date || null,
        id,
      ]
    )

    return NextResponse.json({
      message: "广告更新成功",
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

    console.error("Update ad error:", error)
    return NextResponse.json(
      { error: "更新广告失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.ads.delete')
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "缺少广告ID" },
        { status: 400 }
      )
    }

    await execute("DELETE FROM ads WHERE id = ?", [id])

    return NextResponse.json({
      message: "广告删除成功",
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

    console.error("Delete ad error:", error)
    return NextResponse.json(
      { error: "删除广告失败" },
      { status: 500 }
    )
  }
}
