/**
 * 完整的数据库种子数据脚本
 * 运行方式: pnpm run seed 或 npx tsx scripts/seed-database.ts
 */

import { hashPassword } from "../lib/utils/password"
import {
  createUser,
  addUserBadge,
  setUserSpecialties,
  updateUser,
  followUser,
} from "../lib/models/user"
import { createTerm } from "../lib/models/term"
import { createPaper } from "../lib/models/paper"
import { createComment } from "../lib/models/comment"
import { query, execute } from "../lib/db/connection"
import { closePool } from "../lib/db/connection"

async function seedDatabase() {
  try {
    console.log("🌱 开始创建数据库种子数据...\n")

    // 1. 创建测试用户
    console.log("📝 步骤 1/7: 创建测试用户...")
    const userIds: Record<string, number> = {}

    const testUsers = [
      {
        email: "admin@gaoneng.wiki",
        password: "123456",
        name: "AI研究员",
        avatar: "/ai-researcher-avatar.jpg",
        bio: "专注于大语言模型和AGI研究，OpenAI技术博客译者",
        points: 2580,
        level: 5,
        contributions: 42,
        followers_count: 128,
        following_count: 56,
        streak: 7,
        last_check_in: new Date().toISOString().split("T")[0],
        is_verified: true,
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
        bio: "材料科学与物理学交叉研究，专注于超导材料",
        points: 1890,
        level: 4,
        contributions: 28,
        followers_count: 89,
        following_count: 34,
        streak: 5,
        last_check_in: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        is_verified: true,
        badges: [{ id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" }],
        specialties: ["超导", "纳米材料"],
      },
      {
        email: "editor@gaoneng.wiki",
        password: "123456",
        name: "科技编辑",
        avatar: "/tech-editor-avatar.jpg",
        bio: "专注于AI和科技报道，前科技媒体主编",
        points: 2150,
        level: 4,
        contributions: 35,
        followers_count: 156,
        following_count: 78,
        streak: 3,
        last_check_in: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
        is_verified: true,
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
        followers_count: 0,
        following_count: 0,
        streak: 0,
        last_check_in: null,
        is_verified: false,
        badges: [{ id: "b0", name: "新手上路", icon: "🌱", description: "欢迎加入高能百科" }],
        specialties: [],
      },
      {
        email: "quantum@gaoneng.wiki",
        password: "123456",
        name: "量子物理博士",
        avatar: "/quantum-physicist-avatar.jpg",
        bio: "量子信息理论研究者，发表SCI论文50余篇",
        points: 3200,
        level: 6,
        contributions: 58,
        followers_count: 9800,
        following_count: 67,
        streak: 10,
        last_check_in: new Date().toISOString().split("T")[0],
        is_verified: true,
        badges: [
          { id: "b1", name: "知识先锋", icon: "🏆", description: "贡献超过10个词条" },
          { id: "b4", name: "量子专家", icon: "⚛️", description: "量子计算领域专家" },
        ],
        specialties: ["量子计算", "量子通信", "量子密码"],
      },
    ]

    for (const userData of testUsers) {
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

    // 2. 创建关注关系
    console.log("\n📝 步骤 2/7: 创建关注关系...")
    try {
      await followUser(userIds["demo@gaoneng.wiki"], userIds["admin@gaoneng.wiki"])
      await followUser(userIds["demo@gaoneng.wiki"], userIds["scientist@gaoneng.wiki"])
      await followUser(userIds["scientist@gaoneng.wiki"], userIds["admin@gaoneng.wiki"])
      await followUser(userIds["editor@gaoneng.wiki"], userIds["admin@gaoneng.wiki"])
      await followUser(userIds["editor@gaoneng.wiki"], userIds["quantum@gaoneng.wiki"])
      console.log("  ✅ 关注关系创建完成")
    } catch (error: any) {
      console.log(`  ⚠️  关注关系创建跳过: ${error.message}`)
    }

    // 3. 获取分类ID
    console.log("\n📝 步骤 3/7: 获取分类信息...")
    const categories = await query<{ id: number; slug: string }>(
      "SELECT id, slug FROM categories"
    )
    const categoryMap: Record<string, number> = {}
    categories.forEach((cat) => {
      categoryMap[cat.slug] = cat.id
    })
    console.log(`  ✅ 获取到 ${categories.length} 个分类`)

    // 4. 创建词条
    console.log("\n📝 步骤 4/7: 创建词条...")
    const termData = [
      {
        title: "GPT-5",
        categorySlug: "ai",
        summary:
          "GPT-5 是 OpenAI 预计于 2024-2025 年发布的下一代大型语言模型。相比 GPT-4，GPT-5 预计将在推理能力、多模态理解、代码生成等方面实现重大突破，并可能具备更强的自主学习和规划能力。",
        content: `## 概述

GPT-5 是 OpenAI 正在开发的下一代大型语言模型（LLM），作为 GPT-4 的继任者，预计将在 2024-2025 年间发布。根据业内消息和 OpenAI 的技术路线图，GPT-5 将在多个关键领域实现突破性进展。

## 技术特点

### 1. 增强的推理能力
- **多步骤推理**：能够进行更复杂的逻辑链条推理
- **数学证明**：在形式化数学推理方面大幅提升
- **因果推断**：更好地理解事件之间的因果关系

### 2. 多模态融合
- 深度整合文本、图像、音频、视频理解
- 原生支持实时视觉理解和交互
- 跨模态推理和生成能力

### 3. 长上下文处理
- 上下文窗口预计扩展到数十万甚至上百万 token
- 更好的长文档理解和总结能力

## 潜在应用

1. **科学研究助手**：辅助科学家进行假设生成和实验设计
2. **代码开发**：端到端的软件工程能力
3. **教育个性化**：定制化的学习体验
4. **医疗诊断**：辅助医生进行复杂病例分析`,
        authorEmail: "admin@gaoneng.wiki",
        tags: ["AGI", "大语言模型", "OpenAI"],
        views: 12500,
        likes: 856,
        comments: 124,
        isVerified: true,
      },
      {
        title: "室温超导体 LK-99",
        categorySlug: "materials",
        summary:
          "LK-99 是一种铅-磷灰石结构的材料，由韩国研究团队声称在常压室温下表现出超导特性。如果得到验证，这将是材料科学的革命性突破。",
        content: `## 概述

LK-99 是由韩国研究团队于 2023 年声称发现的一种可能在室温和常压下表现出超导特性的材料。这种材料基于铅-磷灰石结构，如果得到验证，将是超导领域的革命性突破。

## 材料结构

LK-99 的化学式为 Pb₁₀₋ₓCuₓ(PO₄)₆O，其中部分铅原子被铜原子取代。研究者声称这种结构会产生内部应力，从而导致超导特性。

## 争议与验证

截至目前，全球多个实验室尝试复现 LK-99 的超导特性，结果各异：
- 部分实验观察到抗磁性
- 大多数复现实验未能确认超导特性
- 科学界仍在进行严格的验证工作

## 潜在影响

如果室温超导被证实：
1. 电力传输效率将大幅提升
2. 量子计算将更容易实现
3. 磁悬浮交通将变得更加实用
4. 医疗MRI设备成本将大幅降低`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["超导", "材料科学", "能源革命"],
        views: 45000,
        likes: 2341,
        comments: 567,
        isVerified: false,
      },
      {
        title: "Sora",
        categorySlug: "ai",
        summary:
          "Sora 是 OpenAI 开发的文本到视频生成模型，能够根据文本描述生成长达一分钟的高质量视频。它采用了扩散模型架构和 transformer 技术，展示了对物理世界模拟的惊人能力。",
        content: `## 概述

Sora 是 OpenAI 于 2024 年 2 月发布的革命性文本到视频生成模型。它能够根据文本描述生成长达一分钟的高质量、高保真视频内容。

## 技术架构

Sora 采用了创新的技术架构：
- **扩散 Transformer**：结合扩散模型和 Transformer 架构
- **时空补丁**：将视频和图像表示为时空补丁集合
- **可变分辨率**：支持生成不同分辨率和宽高比的视频

## 能力特点

1. **物理世界模拟**：展示了对物理世界规律的理解
2. **时间一致性**：保持视频中物体和场景的连贯性
3. **复杂场景**：能够处理多角色、多动作的复杂场景`,
        authorEmail: "editor@gaoneng.wiki",
        tags: ["视频生成", "AIGC", "扩散模型"],
        views: 28000,
        likes: 1567,
        comments: 289,
        isVerified: true,
      },
      {
        title: "神经形态计算",
        categorySlug: "semiconductor",
        summary:
          "神经形态计算是一种模仿人脑神经网络结构的计算范式。通过使用专门设计的神经形态芯片，可以实现比传统冯·诺依曼架构更高效的AI推理，能耗降低数个数量级。",
        content: `## 概述

神经形态计算（Neuromorphic Computing）是一种受人脑结构和功能启发的计算范式，旨在通过模仿生物神经网络的信息处理方式来实现更高效的计算。

## 核心原理

### 脉冲神经网络
- 使用脉冲信号而非连续值传递信息
- 基于事件驱动的计算方式
- 具有时序编码能力

### 存内计算
- 在存储单元内直接进行计算
- 消除了数据搬移的能耗
- 实现高度并行处理

## 代表性芯片

1. **Intel Loihi 2**：支持100万神经元
2. **IBM TrueNorth**：低功耗神经形态芯片
3. **BrainScaleS**：欧洲脑计划研发`,
        authorEmail: "admin@gaoneng.wiki",
        tags: ["类脑计算", "AI芯片", "低功耗"],
        views: 8900,
        likes: 623,
        comments: 87,
        isVerified: true,
      },
      {
        title: "合成生物学",
        categorySlug: "biotech",
        summary:
          "合成生物学是一门结合生物学和工程学的新兴学科，旨在设计和构建新的生物系统或重新设计现有的自然生物系统。应用领域包括药物生产、生物燃料、环境修复等。",
        content: `## 概述

合成生物学（Synthetic Biology）是21世纪新兴的交叉学科，结合了生物学、工程学、计算机科学等多个领域。其核心目标是设计和构建新的生物组件、系统和生物体。

## 关键技术

### 基因合成
- DNA 从头合成技术
- 基因组规模的 DNA 组装

### 基因编辑
- CRISPR-Cas9 系统
- 碱基编辑和先导编辑

### 代谢工程
- 代谢途径的重新设计
- 异源代谢途径的构建`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["基因编辑", "CRISPR", "生物工程"],
        views: 6700,
        likes: 445,
        comments: 62,
        isVerified: true,
      },
      {
        title: "量子纠错",
        categorySlug: "quantum",
        summary:
          "量子纠错是量子计算中保护量子信息免受噪声和退相干影响的关键技术。",
        content: `## 概述

量子纠错（Quantum Error Correction, QEC）是量子计算领域的核心技术之一，旨在保护脆弱的量子信息免受环境噪声和量子退相干的影响。

## 基本原理

量子纠错通过编码量子信息到更大的量子系统中，使得即使部分量子比特发生错误，原始信息仍然可以被恢复。

## 主要方法

1. **表面码**：最常用的量子纠错码
2. **稳定子码**：基于群论的纠错方法
3. **拓扑码**：利用拓扑性质保护量子信息`,
        authorEmail: "quantum@gaoneng.wiki",
        tags: ["量子计算", "纠错码", "容错计算"],
        views: 5600,
        likes: 389,
        comments: 45,
        isVerified: true,
      },
      {
        title: "可控核聚变",
        categorySlug: "energy",
        summary:
          "可控核聚变是人类追求的终极能源解决方案，模仿太阳的能量产生机制。",
        content: `## 概述

可控核聚变是指在人工控制条件下实现的核聚变反应，被誉为人类的"终极能源"。

## 技术路线

### 磁约束聚变
- 托卡马克装置（如 ITER）
- 仿星器装置

### 惯性约束聚变
- 激光聚变
- 粒子束聚变

## 挑战与前景

主要挑战包括：
1. 实现能量增益（Q值 > 1）
2. 维持稳定等离子体
3. 材料耐受性问题`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["核聚变", "清洁能源", "ITER"],
        views: 15200,
        likes: 1023,
        comments: 156,
        isVerified: true,
      },
      {
        title: "脑机接口",
        categorySlug: "biotech",
        summary:
          "脑机接口是一种在大脑与外部设备之间建立直接通信通道的技术。",
        content: `## 概述

脑机接口（Brain-Computer Interface, BCI）是一种可以在大脑与外部设备之间建立直接通信通道的技术系统。

## 技术类型

### 侵入式BCI
- 植入电极直接记录神经元活动
- 高信号质量，但需要手术

### 非侵入式BCI
- EEG、fNIRS等表面记录技术
- 无需手术，但信号质量较低

## 应用前景

1. 医疗康复：帮助瘫痪患者控制假肢
2. 神经疾病治疗：帕金森、癫痫等
3. 人机交互：未来可能实现思维控制设备`,
        authorEmail: "editor@gaoneng.wiki",
        tags: ["神经科学", "Neuralink", "人机交互"],
        views: 21000,
        likes: 1456,
        comments: 234,
        isVerified: true,
      },
      {
        title: "Transformer 架构",
        categorySlug: "ai",
        summary:
          "Transformer 是一种基于自注意力机制的神经网络架构，彻底改变了自然语言处理和深度学习领域。",
        content: `## 概述

Transformer 架构由 Google 在 2017 年的论文 "Attention Is All You Need" 中提出，完全基于注意力机制，摒弃了循环和卷积结构。

## 核心组件

### 自注意力机制
- 允许模型关注输入序列的不同位置
- 并行计算，提高训练效率

### 位置编码
- 为序列添加位置信息
- 支持并行处理

## 影响

Transformer 架构催生了：
- BERT、GPT 系列模型
- 现代大语言模型的基础
- 多模态模型的发展`,
        authorEmail: "admin@gaoneng.wiki",
        tags: ["深度学习", "NLP", "注意力机制"],
        views: 18500,
        likes: 1234,
        comments: 198,
        isVerified: true,
      },
      {
        title: "CRISPR-Cas9",
        categorySlug: "biotech",
        summary:
          "CRISPR-Cas9 是一种革命性的基因编辑技术，能够精确修改 DNA 序列。",
        content: `## 概述

CRISPR-Cas9 是细菌和古菌的适应性免疫系统，现已被改造为强大的基因编辑工具。

## 工作原理

1. **向导RNA**：识别目标DNA序列
2. **Cas9蛋白**：切割DNA双链
3. **DNA修复**：细胞自然修复机制完成编辑

## 应用领域

- 基因治疗
- 农业改良
- 基础科学研究`,
        authorEmail: "scientist@gaoneng.wiki",
        tags: ["基因编辑", "CRISPR", "生物技术"],
        views: 32000,
        likes: 2100,
        comments: 312,
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

    // 5. 创建论文
    console.log("\n📝 步骤 5/7: 创建论文...")
    const paperData = [
      {
        title: "Attention Is All You Need",
        titleCn: "注意力机制就是你所需要的一切",
        abstract:
          "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        abstractCn:
          "主流的序列转换模型基于复杂的循环或卷积神经网络，包含编码器和解码器。表现最好的模型还通过注意力机制连接编码器和解码器。我们提出了一种新的简单网络架构——Transformer，完全基于注意力机制，完全摒弃了循环和卷积。",
        categorySlug: "ai",
        journal: "NeurIPS 2017",
        publishDate: "2017-06-12",
        arxivId: "1706.03762",
        doi: "10.48550/arXiv.1706.03762",
        pdfUrl: "https://arxiv.org/pdf/1706.03762",
        authors: [
          { name: "Ashish Vaswani", affiliation: "Google Brain" },
          { name: "Noam Shazeer", affiliation: "Google Brain" },
          { name: "Niki Parmar", affiliation: "Google Research" },
        ],
        tags: ["Transformer", "注意力机制", "深度学习", "NLP"],
        citations: 98000,
        views: 1250000,
        downloads: 450000,
        likes: 8956,
        isHighlighted: true,
      },
      {
        title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        titleCn: "BERT：用于语言理解的深度双向Transformer预训练",
        abstract:
          "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
        abstractCn:
          "我们介绍了一种新的语言表示模型BERT，即Transformers的双向编码器表示。与最近的语言表示模型不同，BERT旨在通过在所有层中同时对左右上下文进行条件化，从无标签文本中预训练深度双向表示。",
        categorySlug: "ai",
        journal: "NAACL 2019",
        publishDate: "2018-10-11",
        arxivId: "1810.04805",
        doi: "10.48550/arXiv.1810.04805",
        pdfUrl: "https://arxiv.org/pdf/1810.04805",
        authors: [
          { name: "Jacob Devlin", affiliation: "Google AI Language" },
          { name: "Ming-Wei Chang", affiliation: "Google AI Language" },
        ],
        tags: ["BERT", "预训练", "NLP", "语言模型"],
        citations: 85000,
        views: 980000,
        downloads: 380000,
        likes: 7234,
        isHighlighted: true,
      },
      {
        title: "Room-temperature superconductivity in a carbonaceous sulfur hydride",
        titleCn: "含碳硫氢化物中的室温超导性",
        abstract:
          "Superconductivity at room temperature has been a long-sought goal in condensed matter physics. We report superconductivity in a photochemically transformed carbonaceous sulfur hydride system at 287.7 ± 1.2 K (about 15 °C) at a pressure of 267 ± 10 gigapascals.",
        abstractCn:
          "室温超导性一直是凝聚态物理学的长期追求目标。我们报告了在267±10吉帕压力下，光化学转化的含碳硫氢化物系统中在287.7±1.2 K（约15°C）下的超导性。",
        categorySlug: "materials",
        journal: "Nature",
        publishDate: "2020-10-14",
        arxivId: null,
        doi: "10.1038/s41586-020-2801-z",
        pdfUrl: null,
        authors: [
          { name: "Elliot Snider", affiliation: "University of Rochester" },
          { name: "Ranga P. Dias", affiliation: "University of Rochester" },
        ],
        tags: ["超导", "高压物理", "材料科学"],
        citations: 1200,
        views: 520000,
        downloads: 85000,
        likes: 3456,
        isHighlighted: false,
      },
      {
        title: "Quantum supremacy using a programmable superconducting processor",
        titleCn: "使用可编程超导处理器实现量子霸权",
        abstract:
          "The promise of quantum computers is that certain computational tasks might be executed exponentially faster on a quantum processor than on a classical processor. Here we report the use of a processor with programmable superconducting qubits to create quantum states on 53 qubits.",
        abstractCn:
          "量子计算机的承诺是某些计算任务在量子处理器上的执行速度可能比经典处理器快指数级。在这里，我们报告了使用具有可编程超导量子比特的处理器在53个量子比特上创建量子态。",
        categorySlug: "quantum",
        journal: "Nature",
        publishDate: "2019-10-23",
        arxivId: null,
        doi: "10.1038/s41586-019-1666-5",
        pdfUrl: null,
        authors: [
          { name: "Frank Arute", affiliation: "Google AI Quantum" },
          { name: "John M. Martinis", affiliation: "Google AI Quantum" },
        ],
        tags: ["量子霸权", "超导量子比特", "量子计算"],
        citations: 4500,
        views: 650000,
        downloads: 120000,
        likes: 4123,
        isHighlighted: true,
      },
      {
        title: "CRISPR-Cas9 gene editing in human cells",
        titleCn: "人类细胞中的CRISPR-Cas9基因编辑",
        abstract:
          "The CRISPR-Cas9 system provides a powerful tool for genome editing. Here we demonstrate that CRISPR-Cas9 can efficiently mediate targeted genome modifications in human cells.",
        abstractCn:
          "CRISPR-Cas9系统为基因组编辑提供了强大的工具。在这里，我们证明CRISPR-Cas9可以在人类细胞中有效地介导靶向基因组修饰。",
        categorySlug: "biotech",
        journal: "Science",
        publishDate: "2013-02-15",
        arxivId: null,
        doi: "10.1126/science.1231143",
        pdfUrl: null,
        authors: [
          { name: "Le Cong", affiliation: "MIT" },
          { name: "Feng Zhang", affiliation: "MIT" },
        ],
        tags: ["CRISPR", "基因编辑", "生物技术"],
        citations: 25000,
        views: 890000,
        downloads: 210000,
        likes: 5678,
        isHighlighted: true,
      },
    ]

    const paperIds: number[] = []
    for (const paper of paperData) {
      try {
        const existing = await query<{ id: number }>(
          "SELECT id FROM papers WHERE title = ?",
          [paper.title]
        )
        if (existing.length > 0) {
          paperIds.push(existing[0].id)
          console.log(`  ⏭️  论文 "${paper.title}" 已存在，跳过创建`)
          continue
        }

        const paperId = await createPaper({
          title: paper.title,
          titleCn: paper.titleCn,
          abstract: paper.abstract,
          abstractCn: paper.abstractCn,
          categoryId: categoryMap[paper.categorySlug],
          journal: paper.journal,
          publishDate: paper.publishDate,
          arxivId: paper.arxivId || undefined,
          doi: paper.doi || undefined,
          pdfUrl: paper.pdfUrl || undefined,
          authors: paper.authors,
          tags: paper.tags,
        })

        // 更新统计数据
        await execute(
          `UPDATE papers SET citations = ?, views = ?, downloads = ?, likes_count = ?, is_highlighted = ?, status = 'published' WHERE id = ?`,
          [
            paper.citations,
            paper.views,
            paper.downloads,
            paper.likes,
            paper.isHighlighted,
            paperId,
          ]
        )

        paperIds.push(paperId)
        console.log(`  ✅ 创建论文: ${paper.title}`)
      } catch (error: any) {
        console.error(`  ❌ 创建论文 "${paper.title}" 失败:`, error.message)
      }
    }

    // 6. 创建评论
    console.log("\n📝 步骤 6/7: 创建评论...")
    if (termIds.length > 0) {
      const commentData = [
        {
          termId: termIds[0], // GPT-5
          authorEmail: "scientist@gaoneng.wiki",
          content: "GPT-5 如果真能实现这些能力，将会对科研工作产生巨大影响。期待能用它来辅助材料设计！",
          parentId: null,
          likes: 45,
        },
        {
          termId: termIds[0],
          authorEmail: "admin@gaoneng.wiki",
          content: "是的，AI for Science 正在成为一个重要的研究方向。",
          parentId: null, // 这个应该是回复，但先作为主评论
          likes: 12,
        },
        {
          termId: termIds[0],
          authorEmail: "editor@gaoneng.wiki",
          content: "从技术演进的角度来看，GPT-5 的发布时间可能会比预期更晚，因为算力和安全性的挑战都很大。",
          parentId: null,
          likes: 32,
        },
        {
          termId: termIds[1], // LK-99
          authorEmail: "admin@gaoneng.wiki",
          content: "室温超导如果真的实现，将彻底改变能源行业。期待更多验证实验的结果。",
          parentId: null,
          likes: 78,
        },
        {
          termId: termIds[2], // Sora
          authorEmail: "quantum@gaoneng.wiki",
          content: "视频生成技术发展太快了，Sora 的能力令人惊叹。",
          parentId: null,
          likes: 56,
        },
      ]

      const commentIds: number[] = []
      for (const comment of commentData) {
        try {
          const commentId = await createComment({
            termId: comment.termId,
            authorId: userIds[comment.authorEmail],
            content: comment.content,
            parentId: comment.parentId || undefined,
          })

          // 更新点赞数
          await execute("UPDATE comments SET likes_count = ? WHERE id = ?", [
            comment.likes,
            commentId,
          ])

          commentIds.push(commentId)
        } catch (error: any) {
          console.error(`  ❌ 创建评论失败:`, error.message)
        }
      }

      // 创建回复（需要先有主评论）
      if (commentIds.length >= 2) {
        try {
          const replyId = await createComment({
            termId: termIds[0],
            authorId: userIds["admin@gaoneng.wiki"],
            content: "是的，AI for Science 正在成为一个重要的研究方向。",
            parentId: commentIds[0],
          })
          await execute("UPDATE comments SET likes_count = ? WHERE id = ?", [12, replyId])
          console.log(`  ✅ 创建了 ${commentIds.length} 条评论和回复`)
        } catch (error: any) {
          console.log(`  ⚠️  创建回复跳过: ${error.message}`)
        }
      }
    }

    // 7. 创建点赞数据
    console.log("\n📝 步骤 7/7: 创建点赞数据...")
    if (termIds.length > 0 && Object.keys(userIds).length > 0) {
      const likeData = [
        { userId: userIds["scientist@gaoneng.wiki"], termId: termIds[0] },
        { userId: userIds["editor@gaoneng.wiki"], termId: termIds[0] },
        { userId: userIds["quantum@gaoneng.wiki"], termId: termIds[0] },
        { userId: userIds["admin@gaoneng.wiki"], termId: termIds[1] },
        { userId: userIds["editor@gaoneng.wiki"], termId: termIds[1] },
        { userId: userIds["admin@gaoneng.wiki"], termId: termIds[2] },
        { userId: userIds["scientist@gaoneng.wiki"], termId: termIds[2] },
      ]

      let likeCount = 0
      for (const like of likeData) {
        try {
          await execute(
            "INSERT IGNORE INTO likes (user_id, target_type, target_id) VALUES (?, 'term', ?)",
            [like.userId, like.termId]
          )
          likeCount++
        } catch (error: any) {
          // 忽略重复错误
        }
      }
      console.log(`  ✅ 创建了 ${likeCount} 个点赞记录`)
    }

    // 8. 创建通知数据
    console.log("\n📝 步骤 8/8: 创建通知数据...")
    if (termIds.length > 0) {
      const notificationData = [
        {
          userId: userIds["admin@gaoneng.wiki"],
          type: "like",
          actorId: userIds["scientist@gaoneng.wiki"],
          targetType: "term",
          targetId: termIds[0],
          content: null,
        },
        {
          userId: userIds["admin@gaoneng.wiki"],
          type: "comment",
          actorId: userIds["scientist@gaoneng.wiki"],
          targetType: "term",
          targetId: termIds[0],
          content: "GPT-5 如果真能实现这些能力...",
        },
        {
          userId: userIds["scientist@gaoneng.wiki"],
          type: "follow",
          actorId: userIds["demo@gaoneng.wiki"],
          targetType: null,
          targetId: null,
          content: null,
        },
      ]

      let notificationCount = 0
      for (const notif of notificationData) {
        try {
          await execute(
            `INSERT INTO notifications (user_id, type, actor_id, target_type, target_id, content, is_read, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
            [
              notif.userId,
              notif.type,
              notif.actorId,
              notif.targetType,
              notif.targetId,
              notif.content,
            ]
          )
          notificationCount++
        } catch (error: any) {
          console.error(`  ⚠️  创建通知失败:`, error.message)
        }
      }
      console.log(`  ✅ 创建了 ${notificationCount} 条通知`)
    }

    console.log("\n✨ 数据库种子数据创建完成！")
    console.log("\n📊 数据统计：")
    console.log(`  - 用户: ${Object.keys(userIds).length} 个`)
    console.log(`  - 词条: ${termIds.length} 个`)
    console.log(`  - 论文: ${paperIds.length} 个`)
    console.log("\n🔑 测试账号（密码均为 123456）：")
    Object.entries(userIds).forEach(([email, id]) => {
      const user = testUsers.find((u) => u.email === email)
      if (user) {
        console.log(`  - ${email} (${user.name})`)
      }
    })
  } catch (error) {
    console.error("❌ 创建种子数据时出错:", error)
    throw error
  } finally {
    await closePool()
    process.exit(0)
  }
}

seedDatabase()
