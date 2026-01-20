import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { getAllPermissions, getPermissionsByModule } from "@/lib/models/permission"

// 获取所有权限
export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "admin.permissions.manage")
    const searchParams = request.nextUrl.searchParams
    const module = searchParams.get("module")

    let permissions
    if (module) {
      permissions = await getPermissionsByModule(module)
    } else {
      permissions = await getAllPermissions()
    }

    // 按模块分组
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = []
      }
      acc[perm.module].push(perm)
      return acc
    }, {} as Record<string, typeof permissions>)

    return NextResponse.json({
      permissions,
      grouped,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "权限不足，需要管理权限权限" },
        { status: 403 }
      )
    }

    console.error("Get permissions error:", error)
    return NextResponse.json({ error: "获取权限列表失败" }, { status: 500 })
  }
}
