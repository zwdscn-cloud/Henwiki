import { query, queryOne, execute } from "@/lib/db/connection"
import { Permission, getUserPermissions } from "./permission"

export interface Role {
  id: number
  code: string
  name: string
  description: string | null
  level: number
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[]
}

/**
 * 根据角色代码查找角色
 */
export async function findRoleByCode(code: string): Promise<Role | null> {
  return queryOne<Role>(
    "SELECT * FROM roles WHERE code = ?",
    [code]
  )
}

/**
 * 根据ID查找角色
 */
export async function findRoleById(id: number): Promise<Role | null> {
  return queryOne<Role>(
    "SELECT * FROM roles WHERE id = ?",
    [id]
  )
}

/**
 * 获取所有角色
 */
export async function getAllRoles(): Promise<Role[]> {
  return query<Role>(
    "SELECT * FROM roles ORDER BY level DESC, name"
  )
}

/**
 * 获取用户的所有角色
 */
export async function getUserRoles(userId: number): Promise<Role[]> {
  return query<Role>(
    `SELECT r.*
     FROM roles r
     INNER JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = ?
     ORDER BY r.level DESC`,
    [userId]
  )
}

/**
 * 获取角色的权限
 */
export async function getRolePermissions(roleId: number): Promise<Permission[]> {
  return query<Permission>(
    `SELECT p.*
     FROM permissions p
     INNER JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role_id = ?
     ORDER BY p.module, p.resource, p.action`,
    [roleId]
  )
}

/**
 * 获取角色及其权限
 */
export async function getRoleWithPermissions(roleId: number): Promise<RoleWithPermissions | null> {
  const role = await findRoleById(roleId)
  if (!role) return null
  
  const permissions = await getRolePermissions(roleId)
  return {
    ...role,
    permissions,
  }
}

/**
 * 创建角色
 */
export async function createRole(
  code: string,
  name: string,
  description: string | null = null,
  level: number = 0
): Promise<number> {
  const result = await execute(
    "INSERT INTO roles (code, name, description, level) VALUES (?, ?, ?, ?)",
    [code, name, description, level]
  )
  return result.insertId
}

/**
 * 更新角色
 */
export async function updateRole(
  id: number,
  data: Partial<Pick<Role, "name" | "description" | "level">>
): Promise<void> {
  const fields: string[] = []
  const values: any[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })

  if (fields.length === 0) return

  values.push(id)
  await execute(
    `UPDATE roles SET ${fields.join(", ")} WHERE id = ?`,
    values
  )
}

/**
 * 删除角色（系统角色不能删除）
 */
export async function deleteRole(id: number): Promise<void> {
  await execute(
    "DELETE FROM roles WHERE id = ? AND is_system = FALSE",
    [id]
  )
}

/**
 * 为角色分配权限
 */
export async function assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
  // 先删除现有权限
  await execute(
    "DELETE FROM role_permissions WHERE role_id = ?",
    [roleId]
  )

  // 插入新权限
  if (permissionIds.length > 0) {
    const values = permissionIds.map(() => "(?, ?)").join(", ")
    const params = permissionIds.flatMap((pid) => [roleId, pid])
    await execute(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
      params
    )
  }
}

/**
 * 为用户分配角色
 */
export async function assignRolesToUser(userId: number, roleIds: number[]): Promise<void> {
  // 先删除现有角色
  await execute(
    "DELETE FROM user_roles WHERE user_id = ?",
    [userId]
  )

  // 插入新角色
  if (roleIds.length > 0) {
    const values = roleIds.map(() => "(?, ?)").join(", ")
    const params = roleIds.flatMap((rid) => [userId, rid])
    await execute(
      `INSERT INTO user_roles (user_id, role_id) VALUES ${values}`,
      params
    )
  }
}

/**
 * 获取用户的最高级别角色
 */
export async function getUserHighestRole(userId: number): Promise<Role | null> {
  return queryOne<Role>(
    `SELECT r.*
     FROM roles r
     INNER JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = ?
     ORDER BY r.level DESC
     LIMIT 1`,
    [userId]
  )
}
