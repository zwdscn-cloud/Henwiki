/**
 * 运行权限系统数据库迁移
 * 运行方式: npx tsx scripts/run-permission-migration.ts
 */

import { readFileSync } from "fs"
import { join } from "path"
import { getPool, closePool } from "../lib/db/connection"
import mysql from "mysql2/promise"

async function runMigration() {
  let connection: mysql.Connection | null = null
  try {
    console.log("开始运行权限系统数据库迁移...")

    // 读取迁移文件
    const migrationPath = join(process.cwd(), "lib/db/migrations/create_permission_system.sql")
    const migrationSQL = readFileSync(migrationPath, "utf-8")

    // 移除 USE 语句和注释行
    let sql = migrationSQL
      .replace(/USE\s+\w+\s*;/gi, "")
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim()
        return trimmed.length > 0 && !trimmed.startsWith("--")
      })
      .join("\n")
      .trim()

    // 获取数据库连接
    const pool = getPool()
    connection = await pool.getConnection()

    // 按分号分割 SQL 语句，但要注意字符串中的分号
    const statements: string[] = []
    let current = ""
    let inSingleQuote = false
    let inDoubleQuote = false
    let inBacktick = false

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i]
      const prevChar = i > 0 ? sql[i - 1] : ""

      // 处理引号
      if (char === "'" && prevChar !== "\\" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote
      } else if (char === '"' && prevChar !== "\\" && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote
      } else if (char === "`" && prevChar !== "\\" && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick
      }

      current += char

      // 如果不在任何引号中且遇到分号，结束当前语句
      if (!inSingleQuote && !inDoubleQuote && !inBacktick && char === ";") {
        const trimmed = current.trim()
        if (trimmed.length > 1) {
          // 移除末尾的分号
          statements.push(trimmed.slice(0, -1).trim())
        }
        current = ""
      }
    }

    // 添加最后一条语句（如果没有以分号结尾）
    if (current.trim().length > 0) {
      statements.push(current.trim())
    }

    console.log(`找到 ${statements.length} 条 SQL 语句`)

    // 执行每条 SQL 语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim().length === 0) continue

      try {
        // 显示前50个字符作为提示
        const preview = statement.substring(0, 50).replace(/\n/g, " ")
        console.log(`执行语句 ${i + 1}/${statements.length}: ${preview}...`)
        
        await connection.execute(statement + ";")
        console.log(`✅ 语句 ${i + 1} 执行成功`)
      } catch (error: any) {
        // 如果是重复键错误（数据已存在），继续执行
        if (
          error.code === "ER_DUP_ENTRY" ||
          error.message?.includes("Duplicate entry") ||
          error.code === "ER_DUP_KEYNAME" ||
          error.message?.includes("Duplicate key name")
        ) {
          console.log(`⚠️  语句 ${i + 1} 跳过（数据已存在）`)
          continue
        }
        // 如果是表已存在的错误，继续执行
        if (
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          error.message?.includes("already exists")
        ) {
          console.log(`⚠️  语句 ${i + 1} 跳过（表已存在）`)
          continue
        }
        // 如果是字段已存在的错误，继续执行
        if (
          error.code === "ER_DUP_FIELDNAME" ||
          error.message?.includes("Duplicate column name")
        ) {
          console.log(`⚠️  语句 ${i + 1} 跳过（字段已存在）`)
          continue
        }
        // 如果是索引已存在的错误，继续执行
        if (
          error.code === "ER_DUP_KEYNAME" ||
          error.message?.includes("Duplicate key name")
        ) {
          console.log(`⚠️  语句 ${i + 1} 跳过（索引已存在）`)
          continue
        }
        console.error(`❌ 语句 ${i + 1} 执行失败:`, error.message)
        throw error
      }
    }

    console.log("\n✅ 权限系统数据库迁移完成！")
    console.log("\n已创建以下表：")
    console.log("  - permissions (权限表)")
    console.log("  - roles (角色表)")
    console.log("  - role_permissions (角色权限关联表)")
    console.log("  - user_roles (用户角色关联表)")
    console.log("\n已插入初始数据：")
    console.log("  - 30 个权限")
    console.log("  - 4 个系统角色")
    console.log("  - 角色权限关联")
  } catch (error: any) {
    console.error("❌ 迁移失败:", error.message)
    console.error(error)
    process.exit(1)
  } finally {
    if (connection) {
      connection.release()
    }
    await closePool()
  }
}

runMigration()
