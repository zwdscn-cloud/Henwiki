import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { assignRolesToUser, getUserRoles } from "@/lib/models/role"
import { findUserById } from "@/lib/models/user"

// 获取用户的角色
export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "admin.users.view")
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
    }

    const roles = await getUserRoles(parseInt(userId))

    return NextResponse.json({ roles })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "权限不足，需要查看用户权限" },
        { status: 403 }
      )
    }

    console.error("Get user roles error:", error)
    return NextResponse.json({ error: "获取用户角色失败" }, { status: 500 })
  }
}

// 为用户分配角色
export async function PUT(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "admin.users.role.assign")
    const body = await request.json()
    const { userId, roleIds } = body

    if (!userId || !roleIds || !Array.isArray(roleIds)) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    const user = await findUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    await assignRolesToUser(userId, roleIds)

    const roles = await getUserRoles(userId)

    return NextResponse.json({
      roles,
      message: "用户角色分配成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "权限不足，需要分配用户角色权限" },
        { status: 403 }
      )
    }

    console.error("Assign user roles error:", error)
    return NextResponse.json({ error: "分配用户角色失败" }, { status: 500 })
  }
}
