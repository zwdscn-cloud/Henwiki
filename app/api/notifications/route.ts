import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { query, execute, queryOne } from "@/lib/db/connection"

// 确保notifications表存在
async function ensureNotificationsTable() {
  try {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = 'notifications'`
    )
    
    if (!result || result.count === 0) {
      await execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          user_id BIGINT NOT NULL,
          type ENUM('like', 'comment', 'follow', 'mention', 'system') NOT NULL,
          actor_id BIGINT,
          target_type VARCHAR(50),
          target_id BIGINT,
          content TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_is_read (is_read),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
    }
  } catch (error: any) {
    // 如果表已存在或其他错误，忽略
    if (error.code !== "ER_TABLE_EXISTS_ERROR" && !error.message?.includes("already exists")) {
      console.warn("确保notifications表时出错:", error.message)
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureNotificationsTable()
    const authUser = requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const unreadOnly = searchParams.get("unread") === "true"

    let conditions: string[] = ["n.user_id = ?"]
    let params: any[] = [authUser.userId]

    if (type && type !== "all") {
      conditions.push("n.type = ?")
      params.push(type)
    }

    if (unreadOnly) {
      conditions.push("n.is_read = FALSE")
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const notifications = await query<any>(
      `SELECT 
        n.id,
        n.type,
        n.actor_id,
        n.target_type,
        n.target_id,
        n.content,
        n.is_read,
        n.created_at,
        u.name as actor_name,
        u.avatar as actor_avatar
      FROM notifications n
      LEFT JOIN users u ON n.actor_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT 100`,
      params
    )

    const formatted = notifications.map((n: any) => {
      const notification: any = {
        id: n.id.toString(),
        type: n.type,
        isRead: n.is_read,
        createdAt: n.created_at,
        content: n.content,
      }

      if (n.actor_id) {
        notification.actor = {
          id: n.actor_id.toString(),
          name: n.actor_name,
          avatar: n.actor_avatar || "/placeholder.svg",
        }
      }

      // 根据类型设置 target
      if (n.target_type && n.target_id) {
        if (n.type === "like" || n.type === "comment") {
          notification.target = `词条 #${n.target_id}`
        } else if (n.type === "mention") {
          notification.target = `评论 #${n.target_id}`
        }
      }

      return notification
    })

    // 获取未读数量
    const unreadResult = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [authUser.userId]
    )
    const unreadCount = unreadResult?.count || 0

    return NextResponse.json({
      notifications: formatted,
      unreadCount,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Get notifications error:", error)
    return NextResponse.json(
      { error: "获取通知列表失败" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    const body = await request.json()
    const { id, markAllRead } = body

    if (markAllRead) {
      // 标记所有为已读
      await execute(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
        [authUser.userId]
      )
      return NextResponse.json({
        message: "已标记所有通知为已读",
      })
    } else if (id) {
      // 标记单个为已读
      const result = await execute(
        "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
        [id, authUser.userId]
      )

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: "通知不存在" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: "已标记为已读",
      })
    } else {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Update notification error:", error)
    return NextResponse.json(
      { error: "更新通知失败" },
      { status: 500 }
    )
  }
}
