/**
 * 检查词条内容是否已更新
 * 运行方式: npx tsx scripts/check-term-content.ts
 */

import { query } from "../lib/db/connection"
import { closePool } from "../lib/db/connection"

async function checkTermContent() {
  try {
    console.log("🔍 检查测试词条内容...\n")

    // 获取测试词条
    const terms = await query<{ id: number; title: string; content: string; status: string }>(
      `SELECT id, title, content, status FROM terms WHERE title IN ('Transformer 架构详解', '量子计算基础', '区块链技术原理与应用', 'CRISPR 基因编辑技术')`
    )

    if (terms.length === 0) {
      console.error("❌ 未找到测试词条")
      return
    }

    for (const term of terms) {
      const contentLength = term.content?.length || 0
      const chineseCharCount = (term.content?.match(/[\u4e00-\u9fa5]/g) || []).length
      const titleCount = (term.content?.match(/^##+ /gm) || []).length
      
      console.log(`📄 词条: "${term.title}" (ID: ${term.id})`)
      console.log(`   - 状态: ${term.status}`)
      console.log(`   - 内容长度: ${contentLength} 字符`)
      console.log(`   - 中文字数: 约 ${chineseCharCount} 字`)
      console.log(`   - 标题数量: ${titleCount} 个`)
      if (term.content) {
        console.log(`   - 内容预览: ${term.content.substring(0, 100)}...`)
      } else {
        console.log(`   - 内容: 无`)
      }
      console.log("")
    }

  } catch (error: any) {
    console.error("❌ 错误:", error)
  } finally {
    await closePool()
  }
}

checkTermContent()
  .then(() => {
    console.log("✅ 检查完成")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ 检查失败:", error)
    process.exit(1)
  })
