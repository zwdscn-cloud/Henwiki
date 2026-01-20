/**
 * 为 admin@gaoneng.wiki 分配管理员角色
 * 运行方式: npx tsx scripts/assign-admin-role.ts
 */

import { findUserByEmail } from "../lib/models/user"
import { findRoleByCode, assignRolesToUser, getUserRoles } from "../lib/models/role"
import { closePool } from "../lib/db/connection"

async function assignAdminRole() {
  try {
    console.log("🔍 检查 admin@gaoneng.wiki 用户...")

    // 查找用户
    const user = await findUserByEmail("admin@gaoneng.wiki")
    if (!user) {
      console.error("❌ 用户 admin@gaoneng.wiki 不存在！")
      console.log("💡 请先运行: npx tsx scripts/create-test-users.ts")
      return
    }

    console.log(`✅ 找到用户: ${user.name} (ID: ${user.id})`)

    // 查找 super_admin 角色
    const adminRole = await findRoleByCode("super_admin")
    if (!adminRole) {
      console.error("❌ super_admin 角色不存在！")
      console.log("💡 请先运行权限系统迁移: npx tsx scripts/run-permission-migration.ts")
      return
    }

    console.log(`✅ 找到角色: ${adminRole.name} (ID: ${adminRole.id})`)

    // 检查当前角色
    const currentRoles = await getUserRoles(user.id)
    console.log(`📋 当前角色: ${currentRoles.map(r => r.name).join(", ") || "无"}`)

    // 分配 super_admin 角色
    await assignRolesToUser(user.id, [adminRole.id])
    console.log(`✅ 已为用户分配 ${adminRole.name} 角色`)

    // 再次检查角色
    const updatedRoles = await getUserRoles(user.id)
    console.log(`📋 更新后角色: ${updatedRoles.map(r => r.name).join(", ")}`)

    console.log("\n🎉 管理员角色分配完成！")
    console.log("现在 admin@gaoneng.wiki 可以访问管理后台了。")
  } catch (error: any) {
    console.error("❌ 分配角色时出错:", error.message)
    console.error(error)
  } finally {
    await closePool()
    process.exit(0)
  }
}

assignAdminRole()
