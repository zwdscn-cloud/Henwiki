import { NextRequest } from "next/server"
import { verifyToken, extractTokenFromHeader, JWTPayload } from "@/lib/utils/jwt"
import { findUserById } from "@/lib/models/user"
import { userHasPermission, userHasAnyPermission, userHasAllPermissions } from "@/lib/models/permission"

export interface AuthRequest extends NextRequest {
  user?: JWTPayload
}

/**
 * 从请求中提取并验证用户身份
 */
export function getAuthUser(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get("authorization")
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return null
  }

  return verifyToken(token)
}

/**
 * 检查用户是否已认证（用于 API 路由）
 */
export function requireAuth(request: NextRequest): JWTPayload {
  const user = getAuthUser(request)
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

/**
 * 检查用户是否是管理员（用于 API 路由）
 * 先验证用户是否登录，然后验证用户角色
 * @deprecated 建议使用 requirePermission 替代
 */
export async function requireAdmin(request: NextRequest): Promise<JWTPayload> {
  const authUser = requireAuth(request)
  // 检查是否有任何后台访问权限
  const hasAccess = await userHasAnyPermission(authUser.userId, [
    'admin.dashboard.view',
    'admin.stats.view',
    'admin.users.view',
    'admin.terms.view',
    'admin.papers.view'
  ])
  if (!hasAccess) {
    throw new Error("Forbidden")
  }
  return authUser
}

/**
 * 检查用户是否拥有指定权限
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<JWTPayload> {
  const authUser = requireAuth(request)
  const hasPermission = await userHasPermission(authUser.userId, permission)
  if (!hasPermission) {
    throw new Error("Forbidden")
  }
  return authUser
}

/**
 * 检查用户是否拥有任一权限
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: string[]
): Promise<JWTPayload> {
  const authUser = requireAuth(request)
  const hasPermission = await userHasAnyPermission(authUser.userId, permissions)
  if (!hasPermission) {
    throw new Error("Forbidden")
  }
  return authUser
}

/**
 * 检查用户是否拥有所有权限
 */
export async function requireAllPermissions(
  request: NextRequest,
  permissions: string[]
): Promise<JWTPayload> {
  const authUser = requireAuth(request)
  const hasPermission = await userHasAllPermissions(authUser.userId, permissions)
  if (!hasPermission) {
    throw new Error("Forbidden")
  }
  return authUser
}
