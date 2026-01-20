/**
 * 创建测试用户脚本
 * 运行方式: npx tsx scripts/create-test-users.ts
 */

import { hashPassword } from "../lib/utils/password"
import { createUser, addUserBadge, setUserSpecialties } from "../lib/models/user"
import { getPool, closePool } from "../lib/db/connection"

async function createTestUsers() {
  try {
    console.log("开始创建测试用户...")

    // 测试用户数据
    const testUsers = [
      {
        email: "admin@gaoneng.wiki",
        password: "123456",
        name: "AI研究员",
        avatar: "/ai-researcher-avatar.jpg",
        bio: "专注于大语言模型和AGI研究",
        points: 2580,
        level: 5,
        contributions: 42,
        badges: [
          { id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" },
          { id: "b2", name: "活跃达人", icon: "🔥", description: "连续签到7天" },
          { id: "b3", name: "精选作者", icon: "⭐", description: "词条被收录为精选" },
        ],
        specialties: ["人工智能", "量子计算"],
      },
      {
        email: "scientist@gaoneng.wiki",
        password: "123456",
        name: "材料科学家",
        avatar: "/material-scientist-avatar.jpg",
        bio: "材料科学与物理学交叉研究",
        points: 1890,
        level: 4,
        contributions: 28,
        badges: [{ id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" }],
        specialties: ["超导", "纳米材料"],
      },
      {
        email: "editor@gaoneng.wiki",
        password: "123456",
        name: "科技编辑",
        avatar: "/tech-editor-avatar.jpg",
        bio: "专注于AI和科技报道",
        points: 2150,
        level: 4,
        contributions: 35,
        badges: [{ id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" }],
        specialties: ["科技新闻", "产业分析"],
      },
      {
        email: "demo@gaoneng.wiki",
        password: "123456",
        name: "演示用户",
        avatar: "/placeholder-user.jpg",
        bio: "这是一个演示账号",
        points: 100,
        level: 1,
        contributions: 0,
        badges: [{ id: "b0", name: "新手上路", icon: "🌱", description: "欢迎加入高能百科" }],
        specialties: [],
      },
    ]

    for (const userData of testUsers) {
      try {
        // 检查用户是否已存在
        const { findUserByEmail } = await import("../lib/models/user")
        const existing = await findUserByEmail(userData.email)
        if (existing) {
          console.log(`用户 ${userData.email} 已存在，跳过创建`)
          continue
        }

        // 加密密码
        const passwordHash = await hashPassword(userData.password)

        // 创建用户
        const userId = await createUser(userData.email, passwordHash, userData.name)

        // 更新用户信息
        const { updateUser } = await import("../lib/models/user")
        await updateUser(userId, {
          avatar: userData.avatar,
          bio: userData.bio,
          points: userData.points,
          level: userData.level,
          contributions: userData.contributions,
          role: userData.email === "admin@gaoneng.wiki" ? "admin" : "user",
        })

        // 添加徽章
        for (const badge of userData.badges) {
          await addUserBadge(
            userId,
            badge.id,
            badge.name,
            badge.icon,
            badge.description
          )
        }

        // 设置专业领域
        if (userData.specialties.length > 0) {
          await setUserSpecialties(userId, userData.specialties)
        }

        console.log(`✅ 创建用户成功: ${userData.email} (ID: ${userId})`)
        console.log(`   密码: ${userData.password}`)
      } catch (error: any) {
        console.error(`❌ 创建用户 ${userData.email} 失败:`, error.message)
      }
    }

    console.log("\n测试用户创建完成！")
    console.log("\n可用账号：")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    testUsers.forEach((user) => {
      console.log(`📧 邮箱: ${user.email}`)
      console.log(`🔑 密码: ${user.password}`)
      console.log(`👤 姓名: ${user.name}`)
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    })
  } catch (error) {
    console.error("创建测试用户时出错:", error)
  } finally {
    await closePool()
    process.exit(0)
  }
}

createTestUsers()
