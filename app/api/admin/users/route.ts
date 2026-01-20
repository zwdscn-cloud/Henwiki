import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { query, execute } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.users.view')
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || "all"

    const offset = (page - 1) * pageSize
    const conditions: string[] = []
    const params: any[] = []

    if (search) {
      conditions.push("(u.name LIKE ? OR u.email LIKE ?)")
      params.push(`%${search}%`, `%${search}%`)
    }

    // 注意：当前数据库中没有 role 字段，这里先忽略
    // 后续可以添加 role 字段到 users 表

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // 获取总数
    const [totalResult] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM users u ${whereClause}`,
      params
    )

    // 获取用户列表
    const users = await query<any>(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.bio,
        u.points,
        u.level,
        u.contributions,
        u.followers_count,
        u.following_count,
        u.is_verified,
        u.joined_at,
        u.created_at,
        u.updated_at
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    return NextResponse.json({
      users,
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

    console.error("Get admin users error:", error)
    return NextResponse.json(
      { error: "获取用户列表失败" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.users.edit')
    const body = await request.json()
    const { id, isVerified, points, level } = body

    if (!id) {
      return NextResponse.json(
        { error: "缺少用户ID" },
        { status: 400 }
      )
    }

    const updates: string[] = []
    const params: any[] = []

    if (isVerified !== undefined) {
      updates.push("is_verified = ?")
      params.push(isVerified)
    }

    if (points !== undefined) {
      updates.push("points = ?")
      params.push(points)
    }

    if (level !== undefined) {
      updates.push("level = ?")
      params.push(level)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "没有要更新的字段" },
        { status: 400 }
      )
    }

    params.push(id)
    await execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    )

    return NextResponse.json({
      message: "用户更新成功",
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

    console.error("Update user error:", error)
    return NextResponse.json(
      { error: "更新用户失败" },
      { status: 500 }
    )
  }
}
