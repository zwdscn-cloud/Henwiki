import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "无效的用户ID" },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "followers" // followers 或 following

    let followers: any[] = []

    if (type === "followers") {
      // 获取关注该用户的用户列表
      followers = await query<any>(
        `SELECT 
          u.id,
          u.name,
          u.avatar,
          u.bio,
          u.contributions,
          u.followers_count,
          u.is_verified,
          f.created_at as followed_at
        FROM follows f
        INNER JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = ?
        ORDER BY f.created_at DESC
        LIMIT 100`,
        [userId]
      )
    } else {
      // 获取该用户关注的用户列表
      followers = await query<any>(
        `SELECT 
          u.id,
          u.name,
          u.avatar,
          u.bio,
          u.contributions,
          u.followers_count,
          u.is_verified,
          f.created_at as followed_at
        FROM follows f
        INNER JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = ?
        ORDER BY f.created_at DESC
        LIMIT 100`,
        [userId]
      )
    }

    return NextResponse.json({
      users: followers.map((u) => ({
        id: u.id.toString(),
        name: u.name,
        avatar: u.avatar || "/placeholder.svg",
        bio: u.bio,
        contributions: u.contributions,
        followers: u.followers_count,
        isVerified: u.is_verified,
        followedAt: u.followed_at,
      })),
    })
  } catch (error: any) {
    console.error("Get followers error:", error)
    return NextResponse.json(
      { error: "获取关注者列表失败" },
      { status: 500 }
    )
  }
}
