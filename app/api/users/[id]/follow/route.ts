import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { followUser, unfollowUser, isFollowing } from "@/lib/models/user"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = requireAuth(request)
    const { id } = await params
    const followingId = parseInt(id)

    if (isNaN(followingId)) {
      return NextResponse.json(
        { error: "无效的用户ID" },
        { status: 400 }
      )
    }

    if (authUser.userId === followingId) {
      return NextResponse.json(
        { error: "不能关注自己" },
        { status: 400 }
      )
    }

    await followUser(authUser.userId, followingId)

    return NextResponse.json({
      message: "关注成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    if (error.message === "Cannot follow yourself") {
      return NextResponse.json(
        { error: "不能关注自己" },
        { status: 400 }
      )
    }

    console.error("Follow user error:", error)
    return NextResponse.json(
      { error: "关注失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = requireAuth(request)
    const { id } = await params
    const followingId = parseInt(id)

    if (isNaN(followingId)) {
      return NextResponse.json(
        { error: "无效的用户ID" },
        { status: 400 }
      )
    }

    await unfollowUser(authUser.userId, followingId)

    return NextResponse.json({
      message: "取消关注成功",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Unfollow user error:", error)
    return NextResponse.json(
      { error: "取消关注失败" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = requireAuth(request)
    const { id } = await params
    const followingId = parseInt(id)

    if (isNaN(followingId)) {
      return NextResponse.json(
        { error: "无效的用户ID" },
        { status: 400 }
      )
    }

    const { isFollowing: following } = await import("@/lib/models/user")
    const followingStatus = await following(authUser.userId, followingId)

    return NextResponse.json({
      isFollowing: followingStatus,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    console.error("Check follow status error:", error)
    return NextResponse.json(
      { error: "检查关注状态失败" },
      { status: 500 }
    )
  }
}
