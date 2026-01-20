/**
 * 检查并添加 users 表的 role 字段
 */

import { getPool, closePool, query, execute } from "../lib/db/connection"

async function checkAndAddRoleColumn() {
  try {
    console.log("检查 users 表的 role 字段...")

    // 检查字段是否存在
    const result = await query<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM information_schema.columns 
       WHERE table_schema = DATABASE() 
       AND table_name = 'users' 
       AND column_name = 'role'`
    )

    if (result.length === 0 || result[0].count === 0) {
      console.log("users 表没有 role 字段，正在添加...")
      await execute(`
        ALTER TABLE users
        ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' NOT NULL COMMENT '用户角色：user-普通用户，admin-管理员'
      `)
      await execute(`CREATE INDEX idx_role ON users(role)`)
      console.log("✅ role 字段添加成功")
    } else {
      console.log("✅ users 表已有 role 字段")
    }
  } catch (error: any) {
    if (error.code === "ER_DUP_FIELDNAME" || error.message?.includes("Duplicate column name")) {
      console.log("✅ role 字段已存在")
    } else {
      console.error("❌ 检查/添加 role 字段失败:", error.message)
      throw error
    }
  } finally {
    await closePool()
  }
}

checkAndAddRoleColumn()
