import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { requireAuth } from "@/lib/middleware/auth"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    console.log("[POST /api/upload] Upload request received")
    requireAuth(request)
    console.log("[POST /api/upload] Authentication passed")

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      console.error("[POST /api/upload] No file provided")
      return NextResponse.json(
        { error: "没有上传文件" },
        { status: 400 }
      )
    }

    console.log("[POST /api/upload] File info:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // 验证文件类型 - 支持更多图片格式
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/svg+xml",
      "image/tiff",
      "image/heic",
      "image/heif",
      "image/avif",
    ]
    
    // 也检查文件扩展名作为备用验证
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff", "tif", "heic", "heif", "avif"]
    
    const isValidType = allowedTypes.includes(file.type) || 
                       (fileExtension && allowedExtensions.includes(fileExtension))
    
    if (!isValidType) {
      console.error("[POST /api/upload] Invalid file type:", file.type, fileExtension)
      return NextResponse.json(
        { 
          error: "不支持的文件类型",
          message: `支持的文件类型：${allowedExtensions.join(", ")}`,
          receivedType: file.type,
          receivedExtension: fileExtension,
        },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      console.error("[POST /api/upload] File too large:", file.size, "max:", MAX_FILE_SIZE)
      return NextResponse.json(
        { 
          error: "文件大小超过限制",
          message: `文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`,
          receivedSize: file.size,
          maxSize: MAX_FILE_SIZE,
        },
        { status: 400 }
      )
    }

    // 确保上传目录存在
    try {
      await mkdir(UPLOAD_DIR, { recursive: true })
      console.log("[POST /api/upload] Upload directory ensured:", UPLOAD_DIR)
    } catch (mkdirError: any) {
      console.error("[POST /api/upload] Failed to create upload directory:", mkdirError)
      return NextResponse.json(
        { 
          error: "无法创建上传目录",
          message: "服务器配置错误，请联系管理员",
          details: mkdirError.message,
        },
        { status: 500 }
      )
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const ext = fileExtension || "bin"
    const fileName = `${timestamp}-${randomStr}.${ext}`
    const filePath = join(UPLOAD_DIR, fileName)

    console.log("[POST /api/upload] Saving file to:", filePath)

    // 保存文件
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      console.log("[POST /api/upload] File saved successfully")
    } catch (writeError: any) {
      console.error("[POST /api/upload] Failed to write file:", writeError)
      return NextResponse.json(
        { 
          error: "文件保存失败",
          message: "无法保存文件到服务器",
          details: writeError.message,
        },
        { status: 500 }
      )
    }

    // 返回文件URL
    const fileUrl = `/uploads/${fileName}`
    console.log("[POST /api/upload] Upload successful, URL:", fileUrl)

    return NextResponse.json({
      message: "文件上传成功",
      url: fileUrl,
      fileName: file.name,
      size: file.size,
    })
  } catch (error: any) {
    console.error("[POST /api/upload] Error caught:", error)
    console.error("[POST /api/upload] Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        error: "文件上传失败",
        message: error.message || "文件上传失败，请稍后重试",
      },
      { status: 500 }
    )
  }
}
