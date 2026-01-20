/**
 * API 调用工具函数
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

/**
 * 获取认证 token
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("gaoneng_token")
}

/**
 * 通用 API 请求函数
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken()
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      // 如果是 401 未授权错误，跳转到登录页
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          // 清除无效的 token
          localStorage.removeItem("gaoneng_token")
          // 跳转到登录页，并带上返回地址
          const currentPath = window.location.pathname
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
        }
      }
      
      return {
        error: data.error || "请求失败",
        message: data.message || data.error || "请求失败",
        details: data.details,
      }
    }

    return { data }
  } catch (error: any) {
    return {
      error: error.message || "网络错误",
    }
  }
}

/**
 * GET 请求
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "GET" })
}

/**
 * POST 请求
 */
export async function apiPost<T>(
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PUT 请求
 */
export async function apiPut<T>(
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETE 请求
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "DELETE" })
}

/**
 * 文件上传
 */
export async function uploadFile(file: File): Promise<ApiResponse<{ url: string; fileName: string; size: number }>> {
  try {
    const token = getAuthToken()
    const formData = new FormData()
    formData.append("file", file)

    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    console.log("[uploadFile] Uploading file:", file.name, file.size, file.type)

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers,
      body: formData,
    })

    console.log("[uploadFile] Response status:", response.status)

    const data = await response.json()
    console.log("[uploadFile] Response data:", data)

    if (!response.ok) {
      return {
        error: data.error || "上传失败",
        message: data.message || data.error || "上传失败",
      }
    }

    return { data }
  } catch (error: any) {
    console.error("[uploadFile] Error:", error)
    return {
      error: error.message || "上传失败",
    }
  }
}
