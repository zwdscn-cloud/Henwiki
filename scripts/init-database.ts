import mysql from "mysql2/promise"
import { readFileSync } from "fs"
import { join } from "path"

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
}

async function initDatabase() {
  let connection: mysql.Connection | null = null

  try {
    console.log("正在连接 MySQL 服务器...")
    console.log(`连接信息: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}`)
    
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true, // 允许执行多条 SQL 语句
    })

    console.log("✅ MySQL 连接成功！")

    console.log("正在读取 SQL 初始化脚本...")
    const sqlPath = join(process.cwd(), "lib/db/migrations/init.sql")
    const sql = readFileSync(sqlPath, "utf-8")

    if (!sql || sql.trim().length === 0) {
      throw new Error("SQL 文件为空或无法读取")
    }

    console.log("正在创建数据库和表结构...")
    console.log("这可能需要几秒钟...")
    
    // 执行 SQL 语句
    const [results] = await connection.query(sql)
    
    console.log("✅ 数据库初始化成功！")
    console.log("数据库名称: henwiki")
    console.log("\n接下来你可以运行以下命令创建测试数据：")
    console.log("  pnpm run seed")
    console.log("\n或者仅创建测试用户：")
    console.log("  pnpm run create-test-users")
  } catch (error: any) {
    console.error("\n❌ 数据库初始化失败：")
    console.error("错误详情:", error.message)
    
    if (error.code === "ECONNREFUSED") {
      console.error("\n无法连接到 MySQL 服务器")
      console.error("请确保 MySQL 服务正在运行")
      console.error("可以尝试运行: brew services start mysql (macOS)")
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n数据库访问被拒绝")
      console.error("请检查用户名和密码是否正确")
      console.error(`当前配置: ${dbConfig.user}@${dbConfig.host}`)
    } else if (error.code === "ENOENT") {
      console.error("\n找不到 SQL 文件")
      console.error("请确保 lib/db/migrations/init.sql 文件存在")
    } else if (error.sqlMessage) {
      console.error("\nSQL 错误:", error.sqlMessage)
      console.error("SQL 代码:", error.code)
    } else {
      console.error("\n完整错误信息:", error)
    }
    
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log("\n数据库连接已关闭")
    }
  }
}

initDatabase()
