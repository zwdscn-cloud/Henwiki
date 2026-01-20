import { NextRequest, NextResponse } from "next/server"
import { requirePermission, requireAnyPermission } from "@/lib/middleware/auth"
import {
  getAllRoles,
  getRoleWithPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  findRoleById,
} from "@/lib/models/role"
import { getAllPermissions } from "@/lib/models/permission"

// 获取所有角色
export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "admin.roles.view")

    const roles = await getAllRoles()
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const roleWithPerms = await getRoleWithPermissions(role.id)
        return roleWithPerms || { ...role, permissions: [] }
      })
    )

    return NextResponse.json({ roles: rolesWithPermissions })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "权限不足，需要查看角色权限" },
        { status: 403 }
      )
    }

    console.error("Get roles error:", error)
    return NextResponse.json({ error: "获取角色列表失败" }, { status: 500 })
  }
}

// 创建角色
export async function POST(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "admin.roles.create")
    const body = await request.json()
    const { code, name, description, level, permissionIds } = body

    if (!code || !name) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 检查角色代码是否已存在
    const { findRoleByCode } = await import("@/lib/models/role")
    const existing = await findRoleByCode(code)
    if (existing) {
      return NextResponse.json({ error: "角色代码已存在" }, { status: 400 })
    }

    const roleId = await createRole(code, name, description || null, level || 0)

    // 分配权限
    if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
      await assignPermissionsToRole(roleId, permissionIds)
    }

    const role = await getRoleWithPermissions(roleId)

    return NextResponse.json({ role, message: "角色创建成功" })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "权限不足，需要创建角色权限" },
        { status: 403 }
      )
    }

    console.error("Create role error:", error)
    return NextResponse.json({ error: "创建角色失败" }, { status: 500 })
  }
}

// 更新角色
export async function PUT(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "admin.roles.edit")
    const body = await request.json()
    const { id, name, description, level, permissionIds } = body

    if (!id) {
      return NextResponse.json({ error: "缺少角色ID" }, { status: 400 })
    }

    const role = await findRoleById(id)
    if (!role) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 })
    }

    // 系统角色不能修改基本信息
    if (role.is_system) {
      return NextResponse.json({ error: "系统角色不能修改" }, { status: 400 })
    }

    // 更新角色信息
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (level !== undefined) updateData.level = level

    if (Object.keys(updateData).length > 0) {
      await updateRole(id, updateData)
    }

    // 更新权限
    if (permissionIds && Array.isArray(permissionIds)) {
      await assignPermissionsToRole(id, permissionIds)
    }

    const updatedRole = await getRoleWithPermissions(id)

    return NextResponse.json({ role: updatedRole, message: "角色更新成功" })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "权限不足，需要编辑角色权限" },
        { status: 403 }
      )
    }

    console.error("Update role error:", error)
    return NextResponse.json({ error: "更新角色失败" }, { status: 500 })
  }
}

// 删除角色
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, "admin.roles.delete")
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "缺少角色ID" }, { status: 400 })
    }

    const role = await findRoleById(parseInt(id))
    if (!role) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 })
    }

    // 系统角色不能删除
    if (role.is_system) {
      return NextResponse.json({ error: "系统角色不能删除" }, { status: 400 })
    }

    await deleteRole(parseInt(id))

    return NextResponse.json({ message: "角色删除成功" })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "权限不足，需要删除角色权限" },
        { status: 403 }
      )
    }

    console.error("Delete role error:", error)
    return NextResponse.json({ error: "删除角色失败" }, { status: 500 })
  }
}
