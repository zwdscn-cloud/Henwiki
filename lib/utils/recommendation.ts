/**
 * 智能推荐算法
 * 综合考虑多个因素来推荐内容
 */

import { query } from "@/lib/db/connection"

export interface RecommendationScore {
  termId: number
  score: number
}

/**
 * 计算推荐分数
 * 算法综合考虑：
 * 1. 点赞数权重 (40%)
 * 2. 浏览量权重 (30%)
 * 3. 评论数权重 (20%)
 * 4. 时间衰减因子 (10%) - 新内容优先
 */
function calculateRecommendationScore(
  likesCount: number,
  views: number,
  commentsCount: number,
  createdAt: string
): number {
  // 归一化处理，避免数值过大
  const normalizedLikes = Math.log10(likesCount + 1) * 10
  const normalizedViews = Math.log10(views + 1) * 10
  const normalizedComments = Math.log10(commentsCount + 1) * 10

  // 时间衰减：越新内容分数越高
  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  const daysSinceCreation = (now - created) / (1000 * 60 * 60 * 24)
  // 7天内内容时间因子为1，之后逐渐衰减
  const timeFactor = daysSinceCreation <= 7 
    ? 1.0 
    : Math.max(0.3, 1 - (daysSinceCreation - 7) / 30)

  // 综合评分
  const score = 
    normalizedLikes * 0.4 +      // 点赞权重 40%
    normalizedViews * 0.3 +       // 浏览权重 30%
    normalizedComments * 0.2 +    // 评论权重 20%
    timeFactor * 10 * 0.1         // 时间因子 10%

  return score
}

/**
 * 获取个性化推荐词条（基于用户兴趣）
 */
export async function getPersonalizedRecommendations(
  userId: number | null,
  limit: number = 20,
  categoryId?: number
): Promise<number[]> {
  if (!userId) {
    // 未登录用户，返回通用推荐
    return getGeneralRecommendations(limit, categoryId)
  }

  // 获取用户兴趣：
  // 1. 用户点赞过的词条分类
  // 2. 用户关注的专业领域
  // 3. 用户浏览过的词条分类（如果有浏览历史）

  const userLikedCategories = await query<{ category_id: number }>(
    `SELECT DISTINCT t.category_id
     FROM likes l
     INNER JOIN terms t ON l.target_id = t.id
     WHERE l.user_id = ? AND l.target_type = 'term'
     LIMIT 10`,
    [userId]
  )

  const userSpecialties = await query<{ specialty: string }>(
    `SELECT specialty FROM user_specialties WHERE user_id = ?`,
    [userId]
  )

  // 获取用户关注的用户创建的词条
  const followedUsersTerms = await query<{ id: number }>(
    `SELECT DISTINCT t.id
     FROM terms t
     INNER JOIN follows f ON t.author_id = f.following_id
     WHERE f.follower_id = ? AND t.status = 'published'
     ORDER BY t.created_at DESC
     LIMIT 5`,
    [userId]
  )

  const categoryIds = userLikedCategories.map(c => c.category_id)
  
  // 构建推荐查询
  let sql = `
    SELECT 
      t.id,
      t.likes_count,
      t.views,
      t.comments_count,
      t.created_at,
      CASE
        ${categoryIds.length > 0 
          ? `WHEN t.category_id IN (${categoryIds.map(() => '?').join(',')}) THEN 1.5`
          : 'WHEN 1=0 THEN 1.5'
        }
        ELSE 1.0
      END as category_boost
    FROM terms t
    WHERE t.status = 'published'
    ${categoryId ? 'AND t.category_id = ?' : ''}
    ORDER BY t.created_at DESC
    LIMIT 100
  `

  const params: any[] = []
  if (categoryIds.length > 0) {
    params.push(...categoryIds)
  }
  if (categoryId) {
    params.push(categoryId)
  }

  const terms = await query<any>(sql, params)

  // 计算推荐分数
  const scoredTerms: RecommendationScore[] = terms.map((term: any) => {
    const baseScore = calculateRecommendationScore(
      term.likes_count,
      term.views,
      term.comments_count,
      term.created_at
    )
    // 应用分类加成
    const finalScore = baseScore * term.category_boost
    return {
      termId: term.id,
      score: finalScore,
    }
  })

  // 添加关注用户创建的词条（额外加分）
  followedUsersTerms.forEach((term) => {
    const existing = scoredTerms.find((s) => s.termId === term.id)
    if (existing) {
      existing.score *= 1.3 // 关注用户的内容额外加成
    } else {
      scoredTerms.push({
        termId: term.id,
        score: 50, // 基础分数
      })
    }
  })

  // 按分数排序并返回ID列表
  return scoredTerms
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((t) => t.termId)
}

/**
 * 获取通用推荐（未登录用户或通用推荐）
 */
export async function getGeneralRecommendations(limit: number = 20, categoryId?: number): Promise<number[]> {
  const terms = await query<any>(
    `SELECT 
      id,
      likes_count,
      views,
      comments_count,
      created_at
    FROM terms
    WHERE status = 'published'
    ${categoryId ? 'AND category_id = ?' : ''}
    ORDER BY created_at DESC
    LIMIT ?`,
    categoryId ? [categoryId, limit * 3] : [limit * 3] // 获取更多候选，然后筛选
  )

  const scoredTerms: RecommendationScore[] = terms.map((term: any) => ({
    termId: term.id,
    score: calculateRecommendationScore(
      term.likes_count,
      term.views,
      term.comments_count,
      term.created_at
    ),
  }))

  return scoredTerms
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((t) => t.termId)
}

/**
 * 获取热门词条（带时间权重）
 * 考虑最近7天的活跃度
 */
export async function getTrendingTerms(limit: number = 20, categoryId?: number): Promise<number[]> {
  const terms = await query<any>(
    `SELECT 
      t.id,
      t.likes_count,
      t.views,
      t.comments_count,
      t.created_at,
      -- 最近7天的互动数
      COALESCE(recent_likes.likes_7d, 0) as likes_7d,
      COALESCE(recent_views.views_7d, 0) as views_7d,
      COALESCE(recent_comments.comments_7d, 0) as comments_7d
    FROM terms t
    LEFT JOIN (
      SELECT target_id, COUNT(*) as likes_7d
      FROM likes
      WHERE target_type = 'term' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY target_id
    ) recent_likes ON t.id = recent_likes.target_id
    LEFT JOIN (
      -- 注意：views 是累计值，这里用总views作为近似
      -- 实际应该记录每次view的时间，这里简化处理
      SELECT id, views as views_7d
      FROM terms
      WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ) recent_views ON t.id = recent_views.id
    LEFT JOIN (
      SELECT term_id, COUNT(*) as comments_7d
      FROM comments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY term_id
    ) recent_comments ON t.id = recent_comments.term_id
    WHERE t.status = 'published'
    ${categoryId ? 'AND t.category_id = ?' : ''}
    ORDER BY 
      (likes_7d * 3 + views_7d * 2 + comments_7d * 2) DESC,
      t.views DESC
    LIMIT ?`,
    categoryId ? [categoryId, limit] : [limit]
  )

  return terms.map((t: any) => t.id)
}
