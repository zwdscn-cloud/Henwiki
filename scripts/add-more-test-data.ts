/**
 * 为新增分类添加更多测试数据
 * 运行方式: npx tsx scripts/add-more-test-data.ts
 */

import { hashPassword } from "../lib/utils/password"
import {
  createUser,
  addUserBadge,
  setUserSpecialties,
  updateUser,
} from "../lib/models/user"
import { createTerm } from "../lib/models/term"
import { query, execute } from "../lib/db/connection"
import { closePool } from "../lib/db/connection"

async function addMoreTestData() {
  try {
    console.log("🌱 开始添加更多测试数据...\n")

    // 1. 创建更多测试用户
    console.log("📝 步骤 1/3: 创建更多测试用户...")
    const userIds: Record<string, number> = {}

    const newUsers = [
      {
        email: "robotics@gaoneng.wiki",
        password: "123456",
        name: "机器人工程师",
        avatar: "/engineer-avatar.png",
        bio: "专注于工业机器人和服务机器人研发",
        points: 2100,
        level: 4,
        contributions: 25,
        followers_count: 95,
        following_count: 42,
        streak: 6,
        last_check_in: new Date().toISOString().split("T")[0],
        is_verified: true,
        badges: [{ id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" }],
        specialties: ["robotics", "autonomous"],
      },
      {
        email: "biomedical@gaoneng.wiki",
        password: "123456",
        name: "生物医学研究员",
        avatar: "/biologist-avatar.jpg",
        bio: "生物医学工程与再生医学研究",
        points: 1950,
        level: 4,
        contributions: 22,
        followers_count: 78,
        following_count: 35,
        streak: 4,
        last_check_in: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        is_verified: true,
        badges: [{ id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" }],
        specialties: ["biomedical", "healthtech"],
      },
      {
        email: "data@gaoneng.wiki",
        password: "123456",
        name: "数据科学家",
        avatar: "/researcher-avatar.png",
        bio: "大数据分析与机器学习应用",
        points: 2300,
        level: 5,
        contributions: 38,
        followers_count: 145,
        following_count: 58,
        streak: 8,
        last_check_in: new Date().toISOString().split("T")[0],
        is_verified: true,
        badges: [
          { id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" },
          { id: "b2", name: "活跃达人", icon: "🔥", description: "连续签到7天" },
        ],
        specialties: ["data-science", "cloud-computing"],
      },
      {
        email: "iot@gaoneng.wiki",
        password: "123456",
        name: "物联网专家",
        avatar: "/tech-fan-avatar.jpg",
        bio: "智能家居与工业物联网解决方案",
        points: 1800,
        level: 3,
        contributions: 18,
        followers_count: 67,
        following_count: 28,
        streak: 3,
        last_check_in: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
        is_verified: true,
        badges: [{ id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" }],
        specialties: ["iot", "edge-computing"],
      },
      {
        email: "fintech@gaoneng.wiki",
        password: "123456",
        name: "金融科技分析师",
        avatar: "/observer-avatar.jpg",
        bio: "区块链金融与数字货币研究",
        points: 2050,
        level: 4,
        contributions: 26,
        followers_count: 112,
        following_count: 45,
        streak: 5,
        last_check_in: new Date().toISOString().split("T")[0],
        is_verified: true,
        badges: [{ id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" }],
        specialties: ["fintech", "blockchain"],
      },
      {
        email: "environment@gaoneng.wiki",
        password: "123456",
        name: "环境科学家",
        avatar: "/scientist-avatar.png",
        bio: "气候变化与可持续发展研究",
        points: 1750,
        level: 3,
        contributions: 20,
        followers_count: 82,
        following_count: 31,
        streak: 4,
        last_check_in: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        is_verified: true,
        badges: [{ id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" }],
        specialties: ["environment", "energy"],
      },
    ]

    for (const userData of newUsers) {
      try {
        const { findUserByEmail } = await import("../lib/models/user")
        const existing = await findUserByEmail(userData.email)
        if (existing) {
          userIds[userData.email] = existing.id
          console.log(`  ⏭️  用户 ${userData.email} 已存在，跳过创建`)
          continue
        }

        const passwordHash = await hashPassword(userData.password)
        const userId = await createUser(userData.email, passwordHash, userData.name)

        await updateUser(userId, {
          avatar: userData.avatar,
          bio: userData.bio,
          points: userData.points,
          level: userData.level,
          contributions: userData.contributions,
          followers_count: userData.followers_count,
          following_count: userData.following_count,
          streak: userData.streak,
          last_check_in: userData.last_check_in,
          is_verified: userData.is_verified,
        })

        for (const badge of userData.badges) {
          await addUserBadge(userId, badge.id, badge.name, badge.icon, badge.description)
        }

        if (userData.specialties.length > 0) {
          await setUserSpecialties(userId, userData.specialties)
        }

        userIds[userData.email] = userId
        console.log(`  ✅ 创建用户: ${userData.name} (${userData.email})`)
      } catch (error: any) {
        console.error(`  ❌ 创建用户 ${userData.email} 失败:`, error.message)
      }
    }

    // 2. 获取分类ID
    console.log("\n📝 步骤 2/3: 获取分类信息...")
    const categories = await query<{ id: number; slug: string }>("SELECT id, slug FROM categories")
    const categoryMap: Record<string, number> = {}
    categories.forEach((cat) => {
      categoryMap[cat.slug] = cat.id
    })
    console.log(`  ✅ 获取到 ${categories.length} 个分类`)

    // 3. 创建更多词条
    console.log("\n📝 步骤 3/3: 创建更多词条...")
    const termData = [
      // 机器人学
      {
        title: "人形机器人",
        categorySlug: "robotics",
        summary: "人形机器人是模仿人类外形和行为的机器人系统，能够执行复杂的任务并与人类环境交互。",
        content: `## 概述

人形机器人（Humanoid Robot）是一种设计成人类外形的机器人，具有类似人类的躯干、头部、手臂和腿部结构。

## 技术特点

### 双足行走
- 动态平衡控制
- 步态规划算法
- 地形适应能力

### 人机交互
- 自然语言处理
- 情感识别
- 手势识别

## 代表性产品

1. **Atlas**（Boston Dynamics）
2. **ASIMO**（Honda）
3. **Pepper**（SoftBank Robotics）`,
        authorEmail: "robotics@gaoneng.wiki",
        tags: ["机器人", "人形机器人", "AI"],
        views: 9800,
        likes: 678,
        comments: 89,
        isVerified: true,
      },
      {
        title: "工业4.0",
        categorySlug: "robotics",
        summary: "工业4.0是第四次工业革命，通过智能机器人和自动化系统实现智能制造。",
        content: `## 概述

工业4.0（Industry 4.0）是德国提出的智能制造概念，强调通过物联网、大数据、人工智能等技术实现生产过程的智能化。

## 核心要素

- 智能工厂
- 智能生产
- 智能物流`,
        authorEmail: "robotics@gaoneng.wiki",
        tags: ["智能制造", "自动化", "工业机器人"],
        views: 12000,
        likes: 823,
        comments: 112,
        isVerified: true,
      },
      // 自动驾驶
      {
        title: "L5级自动驾驶",
        categorySlug: "autonomous",
        summary: "L5级是完全自动驾驶，车辆可以在任何条件下完全自主行驶，无需人类干预。",
        content: `## 概述

L5级自动驾驶是SAE定义的自动驾驶最高级别，车辆可以在所有道路条件和环境下完全自主驾驶。

## 技术挑战

- 复杂环境感知
- 实时决策系统
- 安全保障机制`,
        authorEmail: "robotics@gaoneng.wiki",
        tags: ["自动驾驶", "L5", "无人驾驶"],
        views: 15600,
        likes: 1123,
        comments: 145,
        isVerified: true,
      },
      {
        title: "V2X通信",
        categorySlug: "autonomous",
        summary: "V2X是车联网通信技术，使车辆能够与周围环境和其他车辆进行信息交换。",
        content: `## 概述

V2X（Vehicle-to-Everything）通信技术使车辆能够与基础设施、其他车辆、行人和网络进行实时通信。

## 通信类型

- V2V（车对车）
- V2I（车对基础设施）
- V2P（车对行人）
- V2N（车对网络）`,
        authorEmail: "robotics@gaoneng.wiki",
        tags: ["V2X", "车联网", "5G"],
        views: 8900,
        likes: 567,
        comments: 78,
        isVerified: true,
      },
      // 生物医学工程
      {
        title: "3D生物打印",
        categorySlug: "biomedical",
        summary: "3D生物打印技术可以打印活体组织和器官，为再生医学带来革命性突破。",
        content: `## 概述

3D生物打印（3D Bioprinting）是一种使用活细胞作为"墨水"的3D打印技术，可以制造人体组织和器官。

## 应用领域

- 器官移植
- 药物测试
- 组织工程`,
        authorEmail: "biomedical@gaoneng.wiki",
        tags: ["3D打印", "再生医学", "组织工程"],
        views: 13400,
        likes: 945,
        comments: 123,
        isVerified: true,
      },
      {
        title: "可穿戴医疗设备",
        categorySlug: "biomedical",
        summary: "可穿戴医疗设备能够实时监测人体健康指标，实现个性化医疗。",
        content: `## 概述

可穿戴医疗设备（Wearable Medical Devices）是能够佩戴在身上的医疗监测设备，可以持续收集健康数据。

## 功能特点

- 心率监测
- 血压测量
- 血糖监测
- 睡眠分析`,
        authorEmail: "biomedical@gaoneng.wiki",
        tags: ["可穿戴设备", "健康监测", "数字医疗"],
        views: 11200,
        likes: 789,
        comments: 98,
        isVerified: true,
      },
      // 环境科学
      {
        title: "碳捕获与封存",
        categorySlug: "environment",
        summary: "CCS技术可以捕获工业排放的二氧化碳并安全封存，是应对气候变化的重要手段。",
        content: `## 概述

碳捕获与封存（Carbon Capture and Storage, CCS）是一种从大气或工业排放源中捕获二氧化碳并长期封存的技术。

## 技术流程

1. 捕获：从排放源分离CO₂
2. 运输：将CO₂输送到封存地点
3. 封存：将CO₂注入地下深层地质构造`,
        authorEmail: "environment@gaoneng.wiki",
        tags: ["CCS", "碳中和", "气候变化"],
        views: 9800,
        likes: 645,
        comments: 87,
        isVerified: true,
      },
      {
        title: "循环经济",
        categorySlug: "environment",
        summary: "循环经济是一种资源高效利用的经济模式，强调减少浪费和资源循环利用。",
        content: `## 概述

循环经济（Circular Economy）是一种以资源循环利用为核心的经济模式，旨在减少资源消耗和环境污染。

## 核心原则

- 减少（Reduce）
- 再利用（Reuse）
- 再循环（Recycle）`,
        authorEmail: "environment@gaoneng.wiki",
        tags: ["可持续发展", "环保", "资源循环"],
        views: 7600,
        likes: 512,
        comments: 65,
        isVerified: true,
      },
      // 数据科学
      {
        title: "联邦学习",
        categorySlug: "data-science",
        summary: "联邦学习是一种分布式机器学习方法，可以在不共享原始数据的情况下训练模型。",
        content: `## 概述

联邦学习（Federated Learning）是一种机器学习方法，允许多个参与方在不共享原始数据的情况下共同训练模型。

## 优势

- 隐私保护
- 数据安全
- 分布式计算`,
        authorEmail: "data@gaoneng.wiki",
        tags: ["机器学习", "隐私计算", "分布式学习"],
        views: 14500,
        likes: 1023,
        comments: 134,
        isVerified: true,
      },
      {
        title: "知识图谱",
        categorySlug: "data-science",
        summary: "知识图谱是一种结构化的知识表示方法，广泛应用于搜索引擎和推荐系统。",
        content: `## 概述

知识图谱（Knowledge Graph）是一种用图结构表示知识的方法，通过实体、属性和关系来描述现实世界。

## 应用场景

- 搜索引擎
- 推荐系统
- 问答系统
- 智能助手`,
        authorEmail: "data@gaoneng.wiki",
        tags: ["知识图谱", "NLP", "搜索引擎"],
        views: 12800,
        likes: 876,
        comments: 112,
        isVerified: true,
      },
      // 云计算
      {
        title: "Serverless架构",
        categorySlug: "cloud-computing",
        summary: "Serverless是一种无服务器计算模式，开发者无需管理服务器即可运行代码。",
        content: `## 概述

Serverless架构是一种云计算执行模型，云服务提供商负责管理服务器，开发者只需关注代码逻辑。

## 特点

- 自动扩缩容
- 按需付费
- 零运维`,
        authorEmail: "data@gaoneng.wiki",
        tags: ["Serverless", "云计算", "微服务"],
        views: 11200,
        likes: 789,
        comments: 98,
        isVerified: true,
      },
      {
        title: "容器编排",
        categorySlug: "cloud-computing",
        summary: "容器编排技术如Kubernetes可以自动化管理容器化应用的部署和扩展。",
        content: `## 概述

容器编排（Container Orchestration）是自动化容器部署、管理和扩展的过程。

## 主要工具

- Kubernetes
- Docker Swarm
- Apache Mesos`,
        authorEmail: "data@gaoneng.wiki",
        tags: ["Kubernetes", "Docker", "容器化"],
        views: 13400,
        likes: 945,
        comments: 123,
        isVerified: true,
      },
      // 边缘计算
      {
        title: "边缘AI",
        categorySlug: "edge-computing",
        summary: "边缘AI将人工智能计算能力部署到边缘设备，实现低延迟的实时推理。",
        content: `## 概述

边缘AI（Edge AI）是将人工智能模型部署到边缘设备上，在数据产生的地方进行实时推理。

## 优势

- 低延迟
- 隐私保护
- 降低带宽需求`,
        authorEmail: "iot@gaoneng.wiki",
        tags: ["边缘计算", "AI", "实时推理"],
        views: 9800,
        likes: 678,
        comments: 89,
        isVerified: true,
      },
      {
        title: "5G边缘计算",
        categorySlug: "edge-computing",
        summary: "5G边缘计算将计算能力下沉到网络边缘，为低延迟应用提供支持。",
        content: `## 概述

5G边缘计算（5G Edge Computing）结合5G网络和边缘计算技术，为应用提供超低延迟和高带宽。

## 应用场景

- 自动驾驶
- AR/VR
- 工业自动化`,
        authorEmail: "iot@gaoneng.wiki",
        tags: ["5G", "边缘计算", "低延迟"],
        views: 11200,
        likes: 789,
        comments: 98,
        isVerified: true,
      },
      // 物联网
      {
        title: "智能家居",
        categorySlug: "iot",
        summary: "智能家居通过物联网技术实现家居设备的互联互通和智能控制。",
        content: `## 概述

智能家居（Smart Home）利用物联网技术连接家居设备，实现远程控制和自动化管理。

## 核心功能

- 智能照明
- 智能安防
- 智能温控
- 智能家电`,
        authorEmail: "iot@gaoneng.wiki",
        tags: ["智能家居", "IoT", "自动化"],
        views: 15600,
        likes: 1123,
        comments: 145,
        isVerified: true,
      },
      {
        title: "工业物联网",
        categorySlug: "iot",
        summary: "工业物联网通过传感器和网络连接实现工业设备的智能化管理。",
        content: `## 概述

工业物联网（Industrial IoT, IIoT）将物联网技术应用于工业领域，实现设备监控和预测性维护。

## 应用价值

- 提高生产效率
- 降低维护成本
- 优化资源配置`,
        authorEmail: "iot@gaoneng.wiki",
        tags: ["IIoT", "工业4.0", "智能制造"],
        views: 13400,
        likes: 945,
        comments: 123,
        isVerified: true,
      },
      // 通信技术
      {
        title: "6G网络",
        categorySlug: "telecom",
        summary: "6G是下一代移动通信技术，预计将实现太赫兹通信和全息通信。",
        content: `## 概述

6G是第六代移动通信技术，预计在2030年左右商用，将提供比5G更高的速度和更低的延迟。

## 关键技术

- 太赫兹通信
- 全息通信
- 智能反射面`,
        authorEmail: "admin@gaoneng.wiki",
        tags: ["6G", "通信技术", "太赫兹"],
        views: 18900,
        likes: 1345,
        comments: 167,
        isVerified: true,
      },
      {
        title: "卫星互联网",
        categorySlug: "telecom",
        summary: "卫星互联网通过低轨卫星星座提供全球高速互联网接入服务。",
        content: `## 概述

卫星互联网（Satellite Internet）通过低地球轨道（LEO）卫星星座提供全球互联网覆盖。

## 主要项目

- Starlink（SpaceX）
- OneWeb
- Kuiper（Amazon）`,
        authorEmail: "admin@gaoneng.wiki",
        tags: ["卫星互联网", "Starlink", "LEO"],
        views: 14500,
        likes: 1023,
        comments: 134,
        isVerified: true,
      },
      // 纳米技术
      {
        title: "碳纳米管",
        categorySlug: "nanotech",
        summary: "碳纳米管是一种具有优异电学和力学性能的纳米材料，应用前景广阔。",
        content: `## 概述

碳纳米管（Carbon Nanotube, CNT）是由碳原子组成的管状纳米结构，具有独特的电学和力学性质。

## 应用领域

- 电子器件
- 复合材料
- 储能设备`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["纳米材料", "碳纳米管", "新材料"],
        views: 11200,
        likes: 789,
        comments: 98,
        isVerified: true,
      },
      {
        title: "量子点",
        categorySlug: "nanotech",
        summary: "量子点是具有量子限域效应的纳米半导体颗粒，在显示和生物成像中应用广泛。",
        content: `## 概述

量子点（Quantum Dots）是尺寸在纳米级别的半导体颗粒，具有可调的光学性质。

## 应用

- QLED显示
- 生物成像
- 太阳能电池`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["量子点", "纳米材料", "显示技术"],
        views: 9800,
        likes: 678,
        comments: 89,
        isVerified: true,
      },
      // 航空航天
      {
        title: "可重复使用火箭",
        categorySlug: "aerospace",
        summary: "可重复使用火箭技术大幅降低了航天发射成本，开启了商业航天新时代。",
        content: `## 概述

可重复使用火箭（Reusable Rocket）是指能够多次执行发射任务的火箭，显著降低了航天成本。

## 代表产品

- Falcon 9（SpaceX）
- New Shepard（Blue Origin）
- 长征八号（中国）`,
        authorEmail: "admin@gaoneng.wiki",
        tags: ["可重复使用", "SpaceX", "商业航天"],
        views: 18900,
        likes: 1345,
        comments: 167,
        isVerified: true,
      },
      {
        title: "火星探测",
        categorySlug: "aerospace",
        summary: "火星探测是人类探索太阳系的重要一步，多个国家已成功实现火星着陆。",
        content: `## 概述

火星探测（Mars Exploration）是人类对火星进行的科学探测活动，旨在了解火星的地质和气候。

## 主要任务

- 毅力号（NASA）
- 天问一号（中国）
- 希望号（阿联酋）`,
        authorEmail: "admin@gaoneng.wiki",
        tags: ["火星", "深空探测", "行星科学"],
        views: 15600,
        likes: 1123,
        comments: 145,
        isVerified: true,
      },
      // 海洋科技
      {
        title: "深海探测",
        categorySlug: "marine",
        summary: "深海探测技术使人类能够探索海洋最深处，发现新的生物和资源。",
        content: `## 概述

深海探测（Deep Sea Exploration）是指对海洋深处（通常指2000米以下）进行的科学探测活动。

## 技术装备

- 载人深潜器
- 无人遥控潜水器
- 深海钻探平台`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["深海", "海洋科学", "探测技术"],
        views: 8900,
        likes: 567,
        comments: 78,
        isVerified: true,
      },
      {
        title: "海洋能发电",
        categorySlug: "marine",
        summary: "海洋能发电利用海浪、潮汐和温差等海洋能源进行发电，是清洁能源的重要来源。",
        content: `## 概述

海洋能发电（Ocean Energy）利用海洋的动能、势能和温差等能量进行发电。

## 类型

- 潮汐能
- 波浪能
- 温差能
- 盐差能`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["海洋能", "清洁能源", "可再生能源"],
        views: 7600,
        likes: 512,
        comments: 65,
        isVerified: true,
      },
      // 农业科技
      {
        title: "精准农业",
        categorySlug: "agriculture",
        summary: "精准农业利用GPS、传感器和AI技术实现农业生产的精细化管理。",
        content: `## 概述

精准农业（Precision Agriculture）利用现代信息技术实现农业生产的精确管理，提高产量和效率。

## 技术手段

- GPS定位
- 传感器监测
- 无人机作业
- AI决策支持`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["精准农业", "智慧农业", "农业科技"],
        views: 9800,
        likes: 678,
        comments: 89,
        isVerified: true,
      },
      {
        title: "垂直农业",
        categorySlug: "agriculture",
        summary: "垂直农业在多层建筑中种植作物，实现城市农业和资源高效利用。",
        content: `## 概述

垂直农业（Vertical Farming）是在多层建筑中利用人工光照和营养液进行作物种植的农业模式。

## 优势

- 节省土地
- 全年生产
- 减少用水
- 城市就近供应`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["垂直农业", "城市农业", "可持续农业"],
        views: 11200,
        likes: 789,
        comments: 98,
        isVerified: true,
      },
      // 金融科技
      {
        title: "DeFi",
        categorySlug: "fintech",
        summary: "去中心化金融（DeFi）基于区块链技术构建无需中介的金融系统。",
        content: `## 概述

DeFi（Decentralized Finance）是基于区块链技术的开放式金融系统，无需传统金融机构作为中介。

## 核心应用

- 去中心化交易所（DEX）
- 借贷协议
- 流动性挖矿
- 稳定币`,
        authorEmail: "fintech@gaoneng.wiki",
        tags: ["DeFi", "区块链", "去中心化"],
        views: 18900,
        likes: 1345,
        comments: 167,
        isVerified: true,
      },
      {
        title: "央行数字货币",
        categorySlug: "fintech",
        summary: "CBDC是央行发行的数字形式法定货币，代表货币的未来发展方向。",
        content: `## 概述

央行数字货币（Central Bank Digital Currency, CBDC）是央行发行的数字形式法定货币。

## 类型

- 零售型CBDC（面向公众）
- 批发型CBDC（面向金融机构）

## 代表项目

- 数字人民币（中国）
- 数字欧元（欧盟）
- 数字美元（美国研究）`,
        authorEmail: "fintech@gaoneng.wiki",
        tags: ["CBDC", "数字货币", "央行"],
        views: 15600,
        likes: 1123,
        comments: 145,
        isVerified: true,
      },
      // 医疗科技
      {
        title: "AI辅助诊断",
        categorySlug: "healthtech",
        summary: "AI辅助诊断利用机器学习技术帮助医生进行疾病诊断，提高诊断准确性。",
        content: `## 概述

AI辅助诊断（AI-Assisted Diagnosis）利用人工智能技术分析医疗影像和数据，辅助医生进行诊断。

## 应用领域

- 医学影像分析
- 病理诊断
- 基因分析
- 药物发现`,
        authorEmail: "biomedical@gaoneng.wiki",
        tags: ["AI医疗", "医学影像", "辅助诊断"],
        views: 14500,
        likes: 1023,
        comments: 134,
        isVerified: true,
      },
      {
        title: "远程医疗",
        categorySlug: "healthtech",
        summary: "远程医疗通过互联网技术实现远程诊疗，让医疗服务更加便捷。",
        content: `## 概述

远程医疗（Telemedicine）利用通信技术实现远程医疗服务，包括远程诊断、咨询和治疗。

## 优势

- 打破地域限制
- 降低医疗成本
- 提高就医效率
- 减少交叉感染`,
        authorEmail: "biomedical@gaoneng.wiki",
        tags: ["远程医疗", "数字医疗", "互联网医疗"],
        views: 12800,
        likes: 876,
        comments: 112,
        isVerified: true,
      },
      // 教育科技
      {
        title: "个性化学习",
        categorySlug: "edtech",
        summary: "个性化学习利用AI技术根据学生特点定制学习路径，提高学习效果。",
        content: `## 概述

个性化学习（Personalized Learning）是根据每个学生的学习能力、兴趣和进度定制学习内容和方法。

## 技术支撑

- 学习分析
- 自适应学习系统
- AI导师
- 智能推荐`,
        authorEmail: "editor@gaoneng.wiki",
        tags: ["个性化学习", "AI教育", "自适应学习"],
        views: 11200,
        likes: 789,
        comments: 98,
        isVerified: true,
      },
      {
        title: "VR教育",
        categorySlug: "edtech",
        summary: "VR教育通过虚拟现实技术创造沉浸式学习体验，让抽象概念变得直观。",
        content: `## 概述

VR教育（VR Education）利用虚拟现实技术创造沉浸式学习环境，提供身临其境的学习体验。

## 应用场景

- 历史场景重现
- 科学实验模拟
- 技能训练
- 语言学习`,
        authorEmail: "editor@gaoneng.wiki",
        tags: ["VR", "虚拟现实", "沉浸式学习"],
        views: 9800,
        likes: 678,
        comments: 89,
        isVerified: true,
      },
      // 食品科技
      {
        title: "细胞培养肉",
        categorySlug: "foodtech",
        summary: "细胞培养肉是在实验室中培养的肉类，无需屠宰动物，是未来食品的重要方向。",
        content: `## 概述

细胞培养肉（Cultured Meat）是通过细胞培养技术生产的肉类，无需饲养和屠宰动物。

## 优势

- 减少环境影响
- 避免动物痛苦
- 食品安全可控
- 可持续生产`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["人造肉", "细胞培养", "未来食品"],
        views: 18900,
        likes: 1345,
        comments: 167,
        isVerified: true,
      },
      {
        title: "3D打印食品",
        categorySlug: "foodtech",
        summary: "3D打印食品技术可以精确控制食物的形状、营养和口感，实现个性化定制。",
        content: `## 概述

3D打印食品（3D Food Printing）是利用3D打印技术制造食品，可以精确控制食物的形状和成分。

## 应用

- 个性化营养
- 特殊饮食需求
- 食品造型设计
- 太空食品`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["3D打印", "食品科技", "个性化"],
        views: 11200,
        likes: 789,
        comments: 98,
        isVerified: true,
      },
      // 时尚科技
      {
        title: "智能服装",
        categorySlug: "fashiontech",
        summary: "智能服装集成了传感器和电子设备，可以监测健康数据并实现交互功能。",
        content: `## 概述

智能服装（Smart Clothing）是集成了电子设备和传感器的服装，具有健康监测、交互等功能。

## 功能

- 健康监测
- 温度调节
- 姿势纠正
- 运动追踪`,
        authorEmail: "editor@gaoneng.wiki",
        tags: ["智能服装", "可穿戴", "健康监测"],
        views: 9800,
        likes: 678,
        comments: 89,
        isVerified: true,
      },
      {
        title: "可持续时尚",
        categorySlug: "fashiontech",
        summary: "可持续时尚强调环保和伦理，使用可再生材料和循环利用技术。",
        content: `## 概述

可持续时尚（Sustainable Fashion）是注重环境保护和社会责任的时尚产业模式。

## 实践方式

- 使用可再生材料
- 循环利用
- 减少浪费
- 公平贸易`,
        authorEmail: "editor@gaoneng.wiki",
        tags: ["可持续", "环保", "时尚"],
        views: 7600,
        likes: 512,
        comments: 65,
        isVerified: true,
      },
      // 体育科技
      {
        title: "运动数据分析",
        categorySlug: "sportstech",
        summary: "运动数据分析利用传感器和AI技术分析运动员表现，优化训练方案。",
        content: `## 概述

运动数据分析（Sports Analytics）利用数据科学和AI技术分析运动员的表现数据，优化训练和比赛策略。

## 应用

- 表现分析
- 伤病预防
- 战术分析
- 选材评估`,
        authorEmail: "editor@gaoneng.wiki",
        tags: ["运动数据", "数据分析", "体育科技"],
        views: 11200,
        likes: 789,
        comments: 98,
        isVerified: true,
      },
      {
        title: "电子竞技",
        categorySlug: "sportstech",
        summary: "电子竞技是使用电子游戏进行的竞技运动，已成为全球性的体育产业。",
        content: `## 概述

电子竞技（Esports）是使用电子游戏进行的竞技运动，具有完整的赛事体系和职业选手。

## 主要项目

- MOBA类（如LOL、DOTA2）
- FPS类（如CS:GO、Valorant）
- 体育类（如FIFA、NBA 2K）`,
        authorEmail: "editor@gaoneng.wiki",
        tags: ["电子竞技", "电竞", "游戏"],
        views: 18900,
        likes: 1345,
        comments: 167,
        isVerified: true,
      },
      // 建筑科技
      {
        title: "3D打印建筑",
        categorySlug: "architech",
        summary: "3D打印建筑技术可以快速建造房屋，降低建造成本并减少材料浪费。",
        content: `## 概述

3D打印建筑（3D Printed Construction）利用大型3D打印机直接打印建筑结构，实现快速建造。

## 优势

- 快速建造
- 降低成本
- 减少浪费
- 设计自由度高`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["3D打印", "建筑", "快速建造"],
        views: 13400,
        likes: 945,
        comments: 123,
        isVerified: true,
      },
      {
        title: "智能建筑",
        categorySlug: "architech",
        summary: "智能建筑通过物联网和AI技术实现建筑的自动化管理和能源优化。",
        content: `## 概述

智能建筑（Smart Building）利用物联网、AI和自动化技术实现建筑的智能化管理。

## 功能

- 智能照明
- 智能温控
- 能源管理
- 安全监控`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["智能建筑", "物联网", "BIM"],
        views: 11200,
        likes: 789,
        comments: 98,
        isVerified: true,
      },
    ]

    const termIds: number[] = []
    for (const term of termData) {
      try {
        // 检查词条是否已存在
        const existing = await query<{ id: number }>(
          "SELECT id FROM terms WHERE title = ?",
          [term.title]
        )
        if (existing.length > 0) {
          termIds.push(existing[0].id)
          console.log(`  ⏭️  词条 "${term.title}" 已存在，跳过创建`)
          continue
        }

        const termId = await createTerm({
          title: term.title,
          categoryId: categoryMap[term.categorySlug],
          summary: term.summary,
          content: term.content,
          authorId: userIds[term.authorEmail],
          tags: term.tags,
        })

        // 更新统计数据
        await execute(
          `UPDATE terms SET views = ?, likes_count = ?, comments_count = ?, is_verified = ?, status = 'published' WHERE id = ?`,
          [term.views, term.likes, term.comments, term.isVerified, termId]
        )

        termIds.push(termId)
        console.log(`  ✅ 创建词条: ${term.title}`)
      } catch (error: any) {
        console.error(`  ❌ 创建词条 "${term.title}" 失败:`, error.message)
      }
    }

    console.log("\n✨ 测试数据添加完成！")
    console.log("\n📊 数据统计：")
    console.log(`  - 新增用户: ${Object.keys(userIds).length} 个`)
    console.log(`  - 新增词条: ${termIds.length} 个`)
    console.log("\n🔑 新增测试账号（密码均为 123456）：")
    newUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.name})`)
    })
  } catch (error) {
    console.error("❌ 添加测试数据时出错:", error)
    throw error
  } finally {
    await closePool()
    process.exit(0)
  }
}

addMoreTestData()
