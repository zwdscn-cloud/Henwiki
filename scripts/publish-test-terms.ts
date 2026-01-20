/**
 * 发布测试词条，将状态改为 published
 * 运行方式: npx tsx scripts/publish-test-terms.ts
 */

import { query, execute } from "../lib/db/connection"
import { closePool } from "../lib/db/connection"

async function publishTestTerms() {
  try {
    console.log("📢 开始发布测试词条...\n")

    // 获取测试词条
    const terms = await query<{ id: number; title: string; status: string }>(
      `SELECT id, title, status FROM terms WHERE title IN ('Transformer 架构详解', '量子计算基础', '区块链技术原理与应用', 'CRISPR 基因编辑技术')`
    )

    if (terms.length === 0) {
      console.error("❌ 未找到测试词条")
      return
    }

    console.log(`✅ 找到 ${terms.length} 个测试词条\n`)

    // 更新状态为 published
    for (const term of terms) {
      try {
        await execute(
          `UPDATE terms SET status = 'published' WHERE id = ?`,
          [term.id]
        )
        console.log(`✅ 已发布词条: "${term.title}" (ID: ${term.id})`)
        console.log(`   - 原状态: ${term.status}`)
        console.log(`   - 新状态: published\n`)
      } catch (error: any) {
        console.error(`❌ 发布词条 "${term.title}" 失败:`, error.message)
      }
    }

    console.log("🎉 测试词条发布完成！")
  } catch (error: any) {
    console.error("❌ 错误:", error)
  } finally {
    await closePool()
  }
}

publishTestTerms()
  .then(() => {
    console.log("\n✅ 脚本执行完成")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ 脚本执行失败:", error)
    process.exit(1)
  })
