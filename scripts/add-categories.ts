/**
 * 添加更多领域分类到数据库
 * 运行方式: npx tsx scripts/add-categories.ts
 */

import { execute } from "../lib/db/connection"
import { closePool } from "../lib/db/connection"

async function addCategories() {
  try {
    console.log("🌱 开始添加更多领域分类...\n")

    const categories = [
      {
        slug: "robotics",
        label: "机器人学",
        description: "工业机器人、服务机器人、人形机器人等机器人技术",
        color: "bg-indigo-500",
      },
      {
        slug: "autonomous",
        label: "自动驾驶",
        description: "无人驾驶汽车、自动驾驶技术、智能交通系统",
        color: "bg-blue-600",
      },
      {
        slug: "biomedical",
        label: "生物医学工程",
        description: "医疗设备、生物材料、组织工程、再生医学",
        color: "bg-rose-500",
      },
      {
        slug: "environment",
        label: "环境科学",
        description: "气候变化、污染治理、可持续发展、绿色技术",
        color: "bg-emerald-500",
      },
      {
        slug: "data-science",
        label: "数据科学",
        description: "大数据分析、机器学习、数据挖掘、商业智能",
        color: "bg-violet-500",
      },
      {
        slug: "cloud-computing",
        label: "云计算",
        description: "云服务、分布式计算、容器技术、微服务架构",
        color: "bg-sky-500",
      },
      {
        slug: "edge-computing",
        label: "边缘计算",
        description: "边缘设备、实时计算、IoT边缘处理、5G边缘",
        color: "bg-amber-500",
      },
      {
        slug: "iot",
        label: "物联网",
        description: "智能家居、工业物联网、传感器网络、万物互联",
        color: "bg-lime-500",
      },
      {
        slug: "telecom",
        label: "通信技术",
        description: "5G/6G网络、卫星通信、光通信、无线技术",
        color: "bg-fuchsia-500",
      },
      {
        slug: "nanotech",
        label: "纳米技术",
        description: "纳米材料、纳米器件、纳米医学、分子制造",
        color: "bg-cyan-600",
      },
      {
        slug: "aerospace",
        label: "航空航天",
        description: "商用航空、无人机、卫星技术、太空探索",
        color: "bg-orange-600",
      },
      {
        slug: "marine",
        label: "海洋科技",
        description: "深海探测、海洋能源、海水淡化、海洋生物技术",
        color: "bg-blue-500",
      },
      {
        slug: "agriculture",
        label: "农业科技",
        description: "精准农业、基因改良作物、农业机器人、垂直农业",
        color: "bg-green-600",
      },
      {
        slug: "fintech",
        label: "金融科技",
        description: "数字货币、区块链金融、智能投顾、支付创新",
        color: "bg-yellow-600",
      },
      {
        slug: "healthtech",
        label: "医疗科技",
        description: "数字医疗、远程医疗、AI诊断、可穿戴医疗设备",
        color: "bg-red-500",
      },
      {
        slug: "edtech",
        label: "教育科技",
        description: "在线教育、AI教学、虚拟教室、个性化学习",
        color: "bg-purple-600",
      },
      {
        slug: "foodtech",
        label: "食品科技",
        description: "人造肉、3D打印食品、食品工程、营养科学",
        color: "bg-orange-500",
      },
      {
        slug: "fashiontech",
        label: "时尚科技",
        description: "智能服装、可穿戴设备、3D打印服装、可持续时尚",
        color: "bg-pink-600",
      },
      {
        slug: "sportstech",
        label: "体育科技",
        description: "运动数据分析、智能训练、运动装备创新、电子竞技",
        color: "bg-red-600",
      },
      {
        slug: "architech",
        label: "建筑科技",
        description: "智能建筑、3D打印建筑、绿色建筑、建筑信息模型",
        color: "bg-stone-500",
      },
    ]

    let addedCount = 0
    let skippedCount = 0

    for (const category of categories) {
      try {
        await execute(
          `INSERT INTO categories (slug, label, description, color, count) 
           VALUES (?, ?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE 
           label = VALUES(label), 
           description = VALUES(description), 
           color = VALUES(color)`,
          [category.slug, category.label, category.description, category.color]
        )
        addedCount++
        console.log(`  ✅ 添加分类: ${category.label} (${category.slug})`)
      } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
          skippedCount++
          console.log(`  ⏭️  分类 ${category.label} 已存在，跳过`)
        } else {
          console.error(`  ❌ 添加分类 ${category.label} 失败:`, error.message)
        }
      }
    }

    console.log(`\n✨ 分类添加完成！`)
    console.log(`  - 新增: ${addedCount} 个`)
    console.log(`  - 跳过: ${skippedCount} 个`)
    console.log(`  - 总计: ${categories.length} 个分类`)
  } catch (error) {
    console.error("❌ 添加分类时出错:", error)
    throw error
  } finally {
    await closePool()
    process.exit(0)
  }
}

addCategories()
