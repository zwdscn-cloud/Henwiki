import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { query, execute, ensureBookmarksTable } from "@/lib/db/connection"

// 获取所有收藏夹
export async function GET(request: NextRequest) {
  try {
    // 确保 bookmarks 表存在
    await ensureBookmarksTable()
    const authUser = requireAuth(request)

    const folders = await query<{ folder_name: string; count: number }>(
      `SELECT 
        folder_name,
        COUNT(*) as count
      FROM bookmarks
      WHERE user_id = ?
      GROUP BY folder_name
      ORDER BY folder_name`,
      [authUser.userId]
    )

    // 确保默认收藏夹始终存在
    const folderMap = new Map<string, number>()
    folders.forEach((f) => {
      folderMap.set(f.folder_name, f.count)
    })

    // 如果默认收藏夹不存在，添加它
    if (!folderMap.has("default")) {
      folderMap.set("default", 0)
    }

    // 转换为数组并排序
    const folderArray = Array.from(folderMap.entries())
      .map(([folder_name, count]) => ({
        id: folder_name,
        name: folder_name === "default" ? "全部收藏" : folder_name,
        count: count,
      }))
      .sort((a, b) => {
        // 默认收藏夹排在第一位
        if (a.id === "default") return -1
        if (b.id === "default") return 1
        return a.name.localeCompare(b.name)
      })

    return NextResponse.json({
      folders: folderArray,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Get folders error:", error)
    return NextResponse.json(
      { error: "获取收藏夹列表失败" },
      { status: 500 }
    )
  }
}

// 创建收藏夹
export async function POST(request: NextRequest) {
  try {
    // 确保 bookmarks 表存在
    await ensureBookmarksTable()
    const authUser = requireAuth(request)
    const body = await request.json()
    const { folderName } = body

    if (!folderName || typeof folderName !== "string" || folderName.trim() === "") {
      return NextResponse.json(
        { error: "收藏夹名称不能为空" },
        { status: 400 }
      )
    }

    const trimmedName = folderName.trim()

    // 验证名称长度
    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: "收藏夹名称不能超过50个字符" },
        { status: 400 }
      )
    }

    // 检查是否已存在（不区分大小写）
    const existing = await query<any>(
      "SELECT folder_name FROM bookmarks WHERE user_id = ? AND LOWER(folder_name) = LOWER(?) LIMIT 1",
      [authUser.userId, trimmedName]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "收藏夹已存在" },
        { status: 400 }
      )
    }

    // 检查是否是默认收藏夹名称
    if (trimmedName.toLowerCase() === "default" || trimmedName === "全部收藏") {
      return NextResponse.json(
        { error: "不能使用此名称" },
        { status: 400 }
      )
    }

    // 创建收藏夹（通过创建一个临时收藏记录，然后删除它来确保收藏夹存在）
    // 实际上，收藏夹是通过收藏记录自动创建的，这里我们只需要验证名称即可
    // 返回成功，实际创建会在用户添加收藏到该收藏夹时自动完成

    return NextResponse.json({
      message: "收藏夹创建成功",
      folder: {
        id: trimmedName,
        name: trimmedName,
        count: 0,
      },
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Create folder error:", error)
    return NextResponse.json(
      { error: "创建收藏夹失败" },
      { status: 500 }
    )
  }
}

// 删除收藏夹（将收藏移动到默认收藏夹）
export async function DELETE(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const folderName = searchParams.get("folderName")

    if (!folderName) {
      return NextResponse.json(
        { error: "缺少收藏夹名称" },
        { status: 400 }
      )
    }

    if (folderName === "default") {
      return NextResponse.json(
        { error: "不能删除默认收藏夹" },
        { status: 400 }
      )
    }

    // 将该收藏夹下的所有收藏移动到默认收藏夹
    await execute(
      "UPDATE bookmarks SET folder_name = 'default' WHERE user_id = ? AND folder_name = ?",
      [authUser.userId, folderName]
    )

    return NextResponse.json({
      message: "收藏夹已删除，收藏已移动到默认收藏夹",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Delete folder error:", error)
    return NextResponse.json(
      { error: "删除收藏夹失败" },
      { status: 500 }
    )
  }
}

// 重命名收藏夹
export async function PUT(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    const body = await request.json()
    const { oldFolderName, newFolderName } = body

    if (!oldFolderName || !newFolderName) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      )
    }

    if (oldFolderName === "default") {
      return NextResponse.json(
        { error: "不能重命名默认收藏夹" },
        { status: 400 }
      )
    }

    const trimmedNewName = newFolderName.trim()

    if (trimmedNewName.length === 0 || trimmedNewName.length > 50) {
      return NextResponse.json(
        { error: "收藏夹名称长度必须在1-50个字符之间" },
        { status: 400 }
      )
    }

    // 检查新名称是否已存在
    const existing = await query<any>(
      "SELECT folder_name FROM bookmarks WHERE user_id = ? AND LOWER(folder_name) = LOWER(?) AND folder_name != ? LIMIT 1",
      [authUser.userId, trimmedNewName, oldFolderName]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "收藏夹名称已存在" },
        { status: 400 }
      )
    }

    // 更新收藏夹名称
    await execute(
      "UPDATE bookmarks SET folder_name = ? WHERE user_id = ? AND folder_name = ?",
      [trimmedNewName, authUser.userId, oldFolderName]
    )

    return NextResponse.json({
      message: "收藏夹重命名成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Rename folder error:", error)
    return NextResponse.json(
      { error: "重命名收藏夹失败" },
      { status: 500 }
    )
  }
}
