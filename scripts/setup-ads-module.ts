/**
 * 设置广告管理模块
 * 运行方式: npx tsx scripts/setup-ads-module.ts
 * 
 * 这个脚本会：
 * 1. 创建 ads 表
 * 2. 添加广告管理权限
 * 3. 为管理员角色分配权限
 */

import { readFileSync } from "fs"
import { join } from "path"
import { getPool, closePool, execute, query } from "../lib/db/connection"
import mysql from "mysql2/promise"

async function runSQLFile(filePath: string, description: string) {
  const connection = getPool()
  const conn = await connection.getConnection()
  
  try {
    console.log(`\n📄 ${description}...`)
    const sql = readFileSync(filePath, "utf-8")
    
    // 移除 USE 语句和注释行
    let cleanSQL = sql
      .replace(/USE\s+\w+\s*;/gi, "")
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim()
        return trimmed.length > 0 && !trimmed.startsWith("--")
      })
      .join("\n")
      .trim()

    // 按分号分割 SQL 语句
    const statements: string[] = []
    let current = ""
    let inSingleQuote = false
    let inDoubleQuote = false
    let inBacktick = false

    for (let i = 0; i < cleanSQL.length; i++) {
      const char = cleanSQL[i]

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

    // 执行每条 SQL 语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim().length === 0) continue

      try {
        await conn.execute(statement + ";")
        console.log(`  ✅ 语句 ${i + 1}/${statements.length} 执行成功`)
      } catch (error: any) {
        // 忽略已存在的错误
        if (
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          error.message?.includes("already exists") ||
          error.code === "ER_DUP_ENTRY" ||
          error.message?.includes("Duplicate entry") ||
          error.code === "ER_DUP_KEYNAME" ||
          error.message?.includes("Duplicate key name") ||
          error.code === "ER_DUP_FIELDNAME" ||
          error.message?.includes("Duplicate column name")
        ) {
          console.log(`  ⚠️  语句 ${i + 1} 跳过（已存在）`)
          continue
        }
        throw error
      }
    }
    
    console.log(`  ✅ ${description}完成`)
  } catch (error: any) {
    console.error(`  ❌ ${description}失败:`, error.message)
    throw error
  } finally {
    conn.release()
  }
}

async function setupAdsModule() {
  try {
    console.log("🚀 开始设置广告管理模块...\n")

    // 1. 创建 ads 表
    const adsMigrationPath = join(process.cwd(), "lib/db/migrations/add_ads.sql")
    await runSQLFile(adsMigrationPath, "创建 ads 表")

    // 2. 添加权限
    const permissionsPath = join(process.cwd(), "lib/db/migrations/add_ads_permissions.sql")
    await runSQLFile(permissionsPath, "添加广告管理权限")

    // 3. 验证设置
    console.log("\n🔍 验证设置...")
    
    // 检查表是否存在
    const tableCheck = await query<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = 'ads'`
    )
    
    if (tableCheck[0]?.count > 0) {
      console.log("  ✅ ads 表已创建")
    } else {
      throw new Error("ads 表创建失败")
    }

    // 检查权限是否存在
    const permissionCheck = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM permissions WHERE code LIKE 'admin.ads.%'`
    )
    
    if (permissionCheck[0]?.count >= 4) {
      console.log(`  ✅ 已添加 ${permissionCheck[0].count} 个广告管理权限`)
    } else {
      console.log(`  ⚠️  只找到 ${permissionCheck[0]?.count || 0} 个权限，可能部分权限已存在`)
    }

    // 检查角色权限关联
    const rolePermissionCheck = await query<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE p.code LIKE 'admin.ads.%'`
    )
    
    console.log(`  ✅ 已为角色分配 ${rolePermissionCheck[0]?.count || 0} 个权限关联`)

    console.log("\n✅ 广告管理模块设置完成！")
    console.log("\n📝 下一步：")
    console.log("  1. 刷新浏览器页面")
    console.log("  2. 在后台侧边栏应该能看到「广告管理」菜单项")
    console.log("  3. 点击进入即可开始管理广告")
    
  } catch (error: any) {
    console.error("\n❌ 设置失败:", error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

setupAdsModule()
