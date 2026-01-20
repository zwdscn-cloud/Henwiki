/**
 * 运行广告表数据库迁移
 * 运行方式: npx tsx scripts/run-ads-migration.ts
 */

import { readFileSync } from "fs"
import { join } from "path"
import { getPool, closePool } from "../lib/db/connection"
import mysql from "mysql2/promise"

async function runMigration() {
  let connection: mysql.Connection | null = null
  try {
    console.log("开始运行广告表数据库迁移...")

    // 读取迁移文件
    const migrationPath = join(process.cwd(), "lib/db/migrations/add_ads.sql")
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
      const nextChar = i < sql.length - 1 ? sql[i + 1] : ""

      if (char === "'" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote
      } else if (char === '"' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote
      } else if (char === "`" && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick
      }

      current += char

      if (char === ";" && !inSingleQuote && !inDoubleQuote && !inBacktick) {
        statements.push(current.trim())
        current = ""
      }
    }

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

    console.log("\n✅ 广告表数据库迁移完成！")
    console.log("\n已创建以下表：")
    console.log("  - ads (广告表)")
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
