import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // JWT 是无状态的，客户端删除 token 即可
  // 这里可以记录登出日志或刷新 token 黑名单（如果需要）
  return NextResponse.json({
    message: "登出成功",
  })
}
