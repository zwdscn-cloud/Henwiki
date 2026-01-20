import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "contributions" // contributions, points, streak
    const timeRange = searchParams.get("timeRange") || "weekly" // weekly, monthly, all
    const limit = parseInt(searchParams.get("limit") || "100")
    const categoryId = searchParams.get("categoryId") // 可选：按分类筛选

    let users: any[] = []

    if (type === "contributions") {
      // 贡献榜 - 根据词条贡献数排序
      if (timeRange === "weekly") {
        // 本周贡献
        users = await query<any>(
          `SELECT 
            u.id,
            u.name,
            u.avatar,
            u.bio,
            u.contributions,
            u.followers_count,
            u.is_verified,
            COUNT(DISTINCT t.id) as weekly_contributions
          FROM users u
          LEFT JOIN terms t ON u.id = t.author_id 
            AND t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND t.status = 'published'
          GROUP BY u.id
          ORDER BY weekly_contributions DESC, u.contributions DESC
          LIMIT ?`,
          [limit]
        )
      } else if (timeRange === "monthly") {
        // 本月贡献
        users = await query<any>(
          `SELECT 
            u.id,
            u.name,
            u.avatar,
            u.bio,
            u.contributions,
            u.followers_count,
            u.is_verified,
            COUNT(DISTINCT t.id) as monthly_contributions
          FROM users u
          LEFT JOIN terms t ON u.id = t.author_id 
            AND t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND t.status = 'published'
          GROUP BY u.id
          ORDER BY monthly_contributions DESC, u.contributions DESC
          LIMIT ?`,
          [limit]
        )
      } else {
        // 总贡献榜
        if (categoryId) {
          // 按分类筛选：获取在该分类下贡献最多的用户
          users = await query<any>(
            `SELECT 
              u.id,
              u.name,
              u.avatar,
              u.bio,
              u.contributions,
              u.followers_count,
              u.is_verified,
              COUNT(DISTINCT t.id) as category_contributions
            FROM users u
            LEFT JOIN terms t ON u.id = t.author_id 
              AND t.category_id = ?
              AND t.status = 'published'
            GROUP BY u.id
            HAVING category_contributions > 0
            ORDER BY category_contributions DESC, u.contributions DESC
            LIMIT ?`,
            [parseInt(categoryId), limit]
          )
        } else {
          users = await query<any>(
            `SELECT 
              id,
              name,
              avatar,
              bio,
              contributions,
              followers_count,
              is_verified
            FROM users
            ORDER BY contributions DESC
            LIMIT ?`,
            [limit]
          )
        }
      }
    } else if (type === "points") {
      // 积分榜
      users = await query<any>(
        `SELECT 
          id,
          name,
          avatar,
          bio,
          points,
          level,
          contributions,
          followers_count,
          is_verified
        FROM users
        ORDER BY points DESC
        LIMIT ?`,
        [limit]
      )
    } else if (type === "streak") {
      // 签到榜
      users = await query<any>(
        `SELECT 
          id,
          name,
          avatar,
          bio,
          streak,
          points,
          contributions,
          followers_count,
          is_verified
        FROM users
        WHERE streak > 0
        ORDER BY streak DESC
        LIMIT ?`,
        [limit]
      )
    }

    // 获取用户徽章数量
    const userIds = users.map((u) => u.id)
    if (userIds.length > 0) {
      const badges = await query<{ user_id: number; count: number }>(
        `SELECT user_id, COUNT(*) as count 
         FROM user_badges 
         WHERE user_id IN (${userIds.map(() => "?").join(",")})
         GROUP BY user_id`,
        userIds
      )

      const badgeMap = new Map(badges.map((b) => [b.user_id, b.count]))

      users = users.map((u, index) => ({
        id: u.id.toString(),
        name: u.name,
        avatar: u.avatar || "/placeholder.svg",
        bio: u.bio || null,
        rank: index + 1,
        contributions: u.contributions || 0,
        points: u.points || 0,
        level: u.level || 1,
        streak: u.streak || 0,
        followers: u.followers_count || 0,
        badges: badgeMap.get(u.id) || 0,
        isVerified: u.is_verified || false,
        weeklyPoints: type === "contributions" && timeRange === "weekly" ? u.weekly_contributions || 0 : undefined,
        monthlyPoints: type === "contributions" && timeRange === "monthly" ? u.monthly_contributions || 0 : undefined,
      }))
    }

    return NextResponse.json({
      users,
      type,
      timeRange,
    })
  } catch (error: any) {
    console.error("Get leaderboard error:", error)
    return NextResponse.json(
      { error: "获取排行榜失败" },
      { status: 500 }
    )
  }
}
