import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/middleware/auth"
import { query } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const authUser = await requirePermission(request, 'admin.stats.view')

    // 获取统计数据
    const [
      totalTerms,
      totalPapers,
      totalUsers,
      pendingTerms,
      pendingPapers,
      todayViews,
      yesterdayViews,
    ] = await Promise.all([
      // 总词条数
      query<{ count: number }>(
        "SELECT COUNT(*) as count FROM terms WHERE status = 'published'"
      ),
      // 总论文数
      query<{ count: number }>(
        "SELECT COUNT(*) as count FROM papers WHERE status = 'published'"
      ),
      // 总用户数
      query<{ count: number }>("SELECT COUNT(*) as count FROM users"),
      // 待审核词条数
      query<{ count: number }>(
        "SELECT COUNT(*) as count FROM terms WHERE status = 'pending'"
      ),
      // 待审核论文数
      query<{ count: number }>(
        "SELECT COUNT(*) as count FROM papers WHERE status = 'pending'"
      ),
      // 今日访问量（使用 views 字段的增量作为近似）
      query<{ total: number }>(
        `SELECT COALESCE(SUM(views), 0) as total 
         FROM terms 
         WHERE DATE(updated_at) = CURDATE()`
      ),
      // 昨日访问量
      query<{ total: number }>(
        `SELECT COALESCE(SUM(views), 0) as total 
         FROM terms 
         WHERE DATE(updated_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
      ),
    ])

    // 计算增长率
    const todayViewsValue = todayViews[0]?.total || 0
    const yesterdayViewsValue = yesterdayViews[0]?.total || 0
    const viewsChange =
      yesterdayViewsValue > 0
        ? ((todayViewsValue - yesterdayViewsValue) / yesterdayViewsValue) * 100
        : 0

    // 获取最近7天的数据趋势（用于计算词条和论文的增长率）
    const [termsLastWeek, termsThisWeek] = await Promise.all([
      query<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM terms 
         WHERE status = 'published' 
           AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
           AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ),
      query<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM terms 
         WHERE status = 'published' 
           AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ),
    ])

    const [papersLastWeek, papersThisWeek] = await Promise.all([
      query<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM papers 
         WHERE status = 'published' 
           AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
           AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ),
      query<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM papers 
         WHERE status = 'published' 
           AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ),
    ])

    const [usersLastWeek, usersThisWeek] = await Promise.all([
      query<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM users 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
           AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ),
      query<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM users 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ),
    ])

    const termsChange =
      termsLastWeek[0]?.count > 0
        ? ((termsThisWeek[0]?.count - termsLastWeek[0]?.count) /
            termsLastWeek[0]?.count) *
          100
        : 0

    const papersChange =
      papersLastWeek[0]?.count > 0
        ? ((papersThisWeek[0]?.count - papersLastWeek[0]?.count) /
            papersLastWeek[0]?.count) *
          100
        : 0

    const usersChange =
      usersLastWeek[0]?.count > 0
        ? ((usersThisWeek[0]?.count - usersLastWeek[0]?.count) /
            usersLastWeek[0]?.count) *
          100
        : 0

    return NextResponse.json({
      stats: {
        totalTerms: totalTerms[0]?.count || 0,
        totalPapers: totalPapers[0]?.count || 0,
        totalUsers: totalUsers[0]?.count || 0,
        todayViews: todayViewsValue,
        termsChange: termsChange.toFixed(1),
        papersChange: papersChange.toFixed(1),
        usersChange: usersChange.toFixed(1),
        viewsChange: viewsChange.toFixed(1),
      },
      pending: {
        terms: pendingTerms[0]?.count || 0,
        papers: pendingPapers[0]?.count || 0,
        total: (pendingTerms[0]?.count || 0) + (pendingPapers[0]?.count || 0),
      },
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "权限不足，需要管理员权限" },
        { status: 403 }
      )
    }

    console.error("Get admin stats error:", error)
    return NextResponse.json(
      { error: "获取统计数据失败" },
      { status: 500 }
    )
  }
}
