/**
 * 验证权限系统表是否创建成功
 */

import { getPool, closePool, query } from "../lib/db/connection"

async function verifyTables() {
  try {
    console.log("验证权限系统表...\n")

    // 检查表是否存在
    const tables = ["permissions", "roles", "role_permissions", "user_roles"]
    
    for (const tableName of tables) {
      const result = await query<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM information_schema.tables 
         WHERE table_schema = DATABASE() 
         AND table_name = ?`,
        [tableName]
      )
      
      if (result[0]?.count > 0) {
        // 获取表的记录数
        const countResult = await query<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${tableName}`
        )
        console.log(`✅ ${tableName} 表存在，记录数: ${countResult[0]?.count || 0}`)
      } else {
        console.log(`❌ ${tableName} 表不存在`)
      }
    }

    // 检查权限数量
    const permCount = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM permissions"
    )
    console.log(`\n权限总数: ${permCount[0]?.count || 0}`)

    // 检查角色数量
    const roleCount = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM roles"
    )
    console.log(`角色总数: ${roleCount[0]?.count || 0}`)

    // 检查角色权限关联
    const rpCount = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM role_permissions"
    )
    console.log(`角色权限关联数: ${rpCount[0]?.count || 0}`)

    // 检查用户角色关联
    const urCount = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM user_roles"
    )
    console.log(`用户角色关联数: ${urCount[0]?.count || 0}`)

    console.log("\n✅ 权限系统数据库验证完成！")
  } catch (error: any) {
    console.error("❌ 验证失败:", error.message)
    throw error
  } finally {
    await closePool()
  }
}

verifyTables()
