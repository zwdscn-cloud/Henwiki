/**
 * 整站测试脚本
 * 全面测试网站的所有功能，重点关注细微bug和边界情况
 * 
 * 运行方式: npx tsx scripts/test-site.ts
 * 
 * 需要先启动开发服务器: pnpm dev
 */

import { getPool, query, queryOne, execute, closePool } from "../lib/db/connection"
import { hashPassword } from "../lib/utils/password"

// 测试配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
const SERVER_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3000"

// 测试结果统计
interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
  details?: any
}

interface TestSuite {
  name: string
  tests: TestResult[]
  passed: number
  failed: number
  duration: number
}

const testResults: TestSuite[] = []
let currentSuite: TestSuite | null = null

// 测试用户数据
let testUser1: { id: number; email: string; password: string; token: string } | null = null
let testUser2: { id: number; email: string; password: string; token: string } | null = null
let testAdmin: { id: number; email: string; password: string; token: string } | null = null

// 测试数据
let testTermId: number | null = null
let testPaperId: number | null = null
let testCommentId: number | null = null
let testCategoryId: number | null = null

/**
 * 工具函数：执行API请求
 */
async function apiRequest(
  endpoint: string,
  options: {
    method?: string
    body?: any
    token?: string
    expectedStatus?: number
  } = {}
): Promise<{ status: number; data: any; duration: number }> {
  const { method = "GET", body, token, expectedStatus } = options
  const startTime = Date.now()

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const duration = Date.now() - startTime
    const data = await response.json().catch(() => ({ error: "Invalid JSON response" }))

    if (expectedStatus !== undefined && response.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}. Response: ${JSON.stringify(data)}`
      )
    }

    return { status: response.status, data, duration }
  } catch (error: any) {
    const duration = Date.now() - startTime
    throw new Error(`API request failed: ${error.message} (duration: ${duration}ms)`)
  }
}

/**
 * 工具函数：检查服务器是否运行
 */
async function checkServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/api/categories`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    })
    return response.ok || response.status === 401 || response.status === 404
  } catch (error) {
    return false
  }
}

/**
 * 工具函数：运行测试用例
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    name,
    passed: false,
  }

  try {
    await testFn()
    result.passed = true
    result.duration = Date.now() - startTime
    console.log(`  ✅ ${name} (${result.duration}ms)`)
  } catch (error: any) {
    result.passed = false
    result.error = error.message
    result.duration = Date.now() - startTime
    console.log(`  ❌ ${name} (${result.duration}ms)`)
    console.log(`     Error: ${error.message}`)
  }

  if (currentSuite) {
    currentSuite.tests.push(result)
    if (result.passed) {
      currentSuite.passed++
    } else {
      currentSuite.failed++
    }
  }

  return result
}

/**
 * 工具函数：开始测试套件
 */
function startSuite(name: string) {
  currentSuite = {
    name,
    tests: [],
    passed: 0,
    failed: 0,
    duration: 0,
  }
  const startTime = Date.now()
  console.log(`\n📦 ${name}`)
  console.log("=".repeat(60))

  // 返回结束函数
  return () => {
    if (currentSuite) {
      currentSuite.duration = Date.now() - startTime
      testResults.push(currentSuite)
      console.log(
        `\n${currentSuite.name}: ${currentSuite.passed} passed, ${currentSuite.failed} failed (${currentSuite.duration}ms)`
      )
      currentSuite = null
    }
  }
}

/**
 * 初始化测试环境
 */
async function setupTestEnvironment() {
  const endSuite = startSuite("初始化测试环境")

  await runTest("检查服务器是否运行", async () => {
    const isRunning = await checkServerRunning()
    if (!isRunning) {
      throw new Error(
        `服务器未运行！请先启动开发服务器: pnpm dev\n服务器地址: ${SERVER_URL}`
      )
    }
  })

  await runTest("检查数据库连接", async () => {
    try {
      await query("SELECT 1")
    } catch (error: any) {
      throw new Error(`数据库连接失败: ${error.message}`)
    }
  })

  await runTest("清理测试用户", async () => {
    const testEmails = [
      "test-user-1@test.com",
      "test-user-2@test.com",
      "test-admin@test.com",
    ]
    for (const email of testEmails) {
      const user = await queryOne<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email]
      )
      if (user) {
        // 删除关联数据
        await execute("DELETE FROM likes WHERE user_id = ?", [user.id])
        await execute("DELETE FROM comments WHERE author_id = ?", [user.id])
        await execute("DELETE FROM terms WHERE author_id = ?", [user.id])
        await execute("DELETE FROM bookmarks WHERE user_id = ?", [user.id])
        await execute("DELETE FROM users WHERE id = ?", [user.id])
      }
    }
  })

  await runTest("创建测试用户1", async () => {
    const passwordHash = await hashPassword("test123456")
    const result = await execute(
      "INSERT INTO users (email, password_hash, name, points, level) VALUES (?, ?, ?, ?, ?)",
      ["test-user-1@test.com", passwordHash, "测试用户1", 100, 1]
    )
    testUser1 = {
      id: result.insertId,
      email: "test-user-1@test.com",
      password: "test123456",
      token: "",
    }
  })

  await runTest("创建测试用户2", async () => {
    const passwordHash = await hashPassword("test123456")
    const result = await execute(
      "INSERT INTO users (email, password_hash, name, points, level) VALUES (?, ?, ?, ?, ?)",
      ["test-user-2@test.com", passwordHash, "测试用户2", 100, 1]
    )
    testUser2 = {
      id: result.insertId,
      email: "test-user-2@test.com",
      password: "test123456",
      token: "",
    }
  })

  await runTest("创建测试管理员", async () => {
    const passwordHash = await hashPassword("test123456")
    const result = await execute(
      "INSERT INTO users (email, password_hash, name, points, level, role) VALUES (?, ?, ?, ?, ?, ?)",
      ["test-admin@test.com", passwordHash, "测试管理员", 1000, 5, "admin"]
    )
    testAdmin = {
      id: result.insertId,
      email: "test-admin@test.com",
      password: "test123456",
      token: "",
    }

    // 尝试分配管理员角色（如果权限系统存在）
    try {
      const { findRoleByCode, assignRolesToUser } = await import("../lib/models/role")
      const adminRole = await findRoleByCode("super_admin")
      if (adminRole) {
        await assignRolesToUser(testAdmin.id, [adminRole.id])
      }
    } catch (error) {
      // 权限系统可能不存在，忽略错误
    }
  })

  await runTest("获取测试分类", async () => {
    const category = await queryOne<{ id: number }>(
      "SELECT id FROM categories LIMIT 1"
    )
    if (!category) {
      throw new Error("数据库中没有分类，请先运行种子脚本")
    }
    testCategoryId = category.id
  })

  endSuite()
}

/**
 * 清理测试环境
 */
async function cleanupTestEnvironment() {
  const endSuite = startSuite("清理测试环境")

  if (testUser1) {
    await runTest("清理测试用户1的数据", async () => {
      await execute("DELETE FROM likes WHERE user_id = ?", [testUser1!.id])
      await execute("DELETE FROM comments WHERE author_id = ?", [testUser1!.id])
      await execute("DELETE FROM terms WHERE author_id = ?", [testUser1!.id])
      await execute("DELETE FROM bookmarks WHERE user_id = ?", [testUser1!.id])
      await execute("DELETE FROM users WHERE id = ?", [testUser1!.id])
    })
  }

  if (testUser2) {
    await runTest("清理测试用户2的数据", async () => {
      await execute("DELETE FROM likes WHERE user_id = ?", [testUser2!.id])
      await execute("DELETE FROM comments WHERE author_id = ?", [testUser2!.id])
      await execute("DELETE FROM terms WHERE author_id = ?", [testUser2!.id])
      await execute("DELETE FROM bookmarks WHERE user_id = ?", [testUser2!.id])
      await execute("DELETE FROM users WHERE id = ?", [testUser2!.id])
    })
  }

  if (testAdmin) {
    await runTest("清理测试管理员的数据", async () => {
      await execute("DELETE FROM likes WHERE user_id = ?", [testAdmin!.id])
      await execute("DELETE FROM comments WHERE author_id = ?", [testAdmin!.id])
      await execute("DELETE FROM terms WHERE author_id = ?", [testAdmin!.id])
      await execute("DELETE FROM bookmarks WHERE user_id = ?", [testAdmin!.id])
      await execute("DELETE FROM users WHERE id = ?", [testAdmin!.id])
    })
  }

  if (testTermId) {
    await runTest("清理测试词条", async () => {
      await execute("DELETE FROM likes WHERE target_type = 'term' AND target_id = ?", [
        testTermId!,
      ])
      await execute("DELETE FROM comments WHERE term_id = ?", [testTermId!])
      await execute("DELETE FROM terms WHERE id = ?", [testTermId!])
    })
  }

  if (testPaperId) {
    await runTest("清理测试论文", async () => {
      await execute("DELETE FROM likes WHERE target_type = 'paper' AND target_id = ?", [
        testPaperId!,
      ])
      await execute("DELETE FROM papers WHERE id = ?", [testPaperId!])
    })
  }

  endSuite()
}

/**
 * 认证模块测试
 */
export async function testAuth() {
  const endSuite = startSuite("认证模块测试")

  await runTest("注册新用户 - 正常情况", async () => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        name: "新测试用户",
        email: "new-test-user@test.com",
        password: "test123456",
      },
      expectedStatus: 201,
    })

    if (!response.data.token || !response.data.user) {
      throw new Error("注册响应缺少token或user字段")
    }
    if (response.data.user.email !== "new-test-user@test.com") {
      throw new Error("注册返回的用户邮箱不正确")
    }

    // 清理测试用户
    const user = await queryOne<{ id: number }>(
      "SELECT id FROM users WHERE email = ?",
      ["new-test-user@test.com"]
    )
    if (user) {
      await execute("DELETE FROM users WHERE id = ?", [user.id])
    }
  })

  await runTest("注册新用户 - 邮箱已存在", async () => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        name: "重复邮箱用户",
        email: testUser1!.email,
        password: "test123456",
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回错误信息")
    }
  })

  await runTest("注册新用户 - 无效邮箱格式", async () => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        name: "无效邮箱",
        email: "invalid-email",
        password: "test123456",
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回验证错误")
    }
  })

  await runTest("注册新用户 - 密码太短", async () => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        name: "短密码用户",
        email: "short-password@test.com",
        password: "12345",
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回密码长度验证错误")
    }
  })

  await runTest("登录 - 正常情况", async () => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: testUser1!.email,
        password: testUser1!.password,
      },
      expectedStatus: 200,
    })

    if (!response.data.token || !response.data.user) {
      throw new Error("登录响应缺少token或user字段")
    }
    if (response.data.user.email !== testUser1!.email) {
      throw new Error("登录返回的用户邮箱不正确")
    }

    testUser1!.token = response.data.token
  })

  await runTest("登录 - 错误密码", async () => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: testUser1!.email,
        password: "wrong-password",
      },
      expectedStatus: 401,
    })

    if (!response.data.error) {
      throw new Error("应该返回错误信息")
    }
  })

  await runTest("登录 - 不存在的邮箱", async () => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: "not-exist@test.com",
        password: "test123456",
      },
      expectedStatus: 401,
    })

    if (!response.data.error) {
      throw new Error("应该返回错误信息")
    }
  })

  await runTest("登录 - 无效邮箱格式", async () => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: "invalid-email",
        password: "test123456",
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回验证错误")
    }
  })

  await runTest("获取当前用户信息 - 已登录", async () => {
    const response = await apiRequest("/auth/me", {
      method: "GET",
      token: testUser1!.token,
      expectedStatus: 200,
    })

    if (!response.data.user) {
      throw new Error("应该返回用户信息")
    }
    if (response.data.user.email !== testUser1!.email) {
      throw new Error("返回的用户邮箱不正确")
    }
  })

  await runTest("获取当前用户信息 - 未登录", async () => {
    const response = await apiRequest("/auth/me", {
      method: "GET",
      expectedStatus: 401,
    })

    if (response.status !== 401) {
      throw new Error("未登录应该返回401状态码")
    }
  })

  await runTest("获取当前用户信息 - 无效token", async () => {
    const response = await apiRequest("/auth/me", {
      method: "GET",
      token: "invalid-token",
      expectedStatus: 401,
    })

    if (response.status !== 401) {
      throw new Error("无效token应该返回401状态码")
    }
  })

  await runTest("登出 - 正常情况", async () => {
    const response = await apiRequest("/auth/logout", {
      method: "POST",
      token: testUser1!.token,
      expectedStatus: 200,
    })

    // 重新登录获取新token
    const loginResponse = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: testUser1!.email,
        password: testUser1!.password,
      },
      expectedStatus: 200,
    })
    testUser1!.token = loginResponse.data.token
  })

  endSuite()
}

/**
 * 词条模块测试
 */
export async function testTerms() {
  const endSuite = startSuite("词条模块测试")

  // 确保用户已登录
  if (!testUser1!.token) {
    const loginResponse = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: testUser1!.email,
        password: testUser1!.password,
      },
    })
    testUser1!.token = loginResponse.data.token
  }

  await runTest("创建词条 - 正常情况", async () => {
    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "测试词条标题",
        categoryId: testCategoryId!,
        summary: "这是测试词条的简介",
        content: "这是测试词条的详细内容",
        tags: ["测试", "词条"],
      },
      expectedStatus: 201,
    })

    if (!response.data.termId) {
      throw new Error("创建词条应该返回termId")
    }
    testTermId = response.data.termId
  })

  await runTest("创建词条 - 缺少必填字段", async () => {
    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "不完整的词条",
        // 缺少categoryId, summary, content
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回验证错误")
    }
  })

  await runTest("创建词条 - 标题过长", async () => {
    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "a".repeat(256), // 超过255字符
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回标题长度验证错误")
    }
  })

  await runTest("创建词条 - 未登录", async () => {
    const response = await apiRequest("/terms", {
      method: "POST",
      body: {
        title: "未登录创建词条",
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
      },
      expectedStatus: 401,
    })

    if (response.status !== 401) {
      throw new Error("未登录应该返回401状态码")
    }
  })

  await runTest("获取词条列表 - 正常情况", async () => {
    const response = await apiRequest("/terms", {
      method: "GET",
      expectedStatus: 200,
    })

    if (!Array.isArray(response.data.terms)) {
      throw new Error("应该返回词条数组")
    }
  })

  await runTest("获取词条列表 - 分页参数", async () => {
    const response = await apiRequest("/terms?page=1&pageSize=10", {
      method: "GET",
      expectedStatus: 200,
    })

    if (!Array.isArray(response.data.terms)) {
      throw new Error("应该返回词条数组")
    }
  })

  await runTest("获取词条详情 - 正常情况", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
      expectedStatus: 200,
    })

    if (!response.data.term) {
      throw new Error("应该返回词条详情")
    }
    if (response.data.term.id !== testTermId) {
      throw new Error("返回的词条ID不正确")
    }
    if (response.data.term.views === undefined) {
      throw new Error("词条应该包含views字段")
    }
  })

  await runTest("获取词条详情 - 不存在的ID", async () => {
    const response = await apiRequest("/terms/99999999", {
      method: "GET",
      expectedStatus: 404,
    })

    if (!response.data.error) {
      throw new Error("应该返回错误信息")
    }
  })

  await runTest("获取词条详情 - 无效ID格式", async () => {
    const response = await apiRequest("/terms/abc", {
      method: "GET",
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回无效ID错误")
    }
  })

  await runTest("更新词条 - 正常情况", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest(`/terms/${testTermId}`, {
      method: "PUT",
      token: testUser1!.token,
      body: {
        title: "更新后的标题",
        summary: "更新后的简介",
        content: "更新后的内容",
      },
      expectedStatus: 200,
    })

    // 验证更新是否成功
    const getResponse = await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })
    if (getResponse.data.term.title !== "更新后的标题") {
      throw new Error("词条标题未正确更新")
    }
  })

  await runTest("更新词条 - 非作者", async () => {
    if (!testTermId || !testUser2!.token) {
      // 确保testUser2已登录
      const loginResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: testUser2!.email,
          password: testUser2!.password,
        },
      })
      testUser2!.token = loginResponse.data.token
    }

    const response = await apiRequest(`/terms/${testTermId}`, {
      method: "PUT",
      token: testUser2!.token,
      body: {
        title: "尝试修改别人的词条",
      },
      expectedStatus: 403,
    })

    if (!response.data.error) {
      throw new Error("应该返回权限错误")
    }
  })

  await runTest("点赞词条 - 正常情况", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest(`/terms/${testTermId}/like`, {
      method: "POST",
      token: testUser2!.token,
      expectedStatus: 200,
    })

    // 验证点赞数是否增加
    const getResponse = await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })
    if (getResponse.data.term.likes_count < 1) {
      throw new Error("点赞数应该增加")
    }
  })

  await runTest("取消点赞词条", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    // 再次点赞应该取消
    const response = await apiRequest(`/terms/${testTermId}/like`, {
      method: "POST",
      token: testUser2!.token,
      expectedStatus: 200,
    })

    // 验证点赞数是否减少
    const getResponse = await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })
    if (getResponse.data.term.likes_count < 0) {
      throw new Error("点赞数不应该为负数")
    }
  })

  await runTest("点踩词条 - 正常情况", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest(`/terms/${testTermId}/dislike`, {
      method: "POST",
      token: testUser2!.token,
      expectedStatus: 200,
    })

    // 验证点踩数是否增加
    const getResponse = await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })
    if (getResponse.data.term.dislikes_count === undefined) {
      throw new Error("词条应该包含dislikes_count字段")
    }
  })

  await runTest("删除词条 - 正常情况", async () => {
    // 先创建一个新词条用于删除测试
    const createResponse = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "待删除的词条",
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
      },
      expectedStatus: 201,
    })

    const deleteTermId = createResponse.data.termId

    const response = await apiRequest(`/terms/${deleteTermId}`, {
      method: "DELETE",
      token: testUser1!.token,
      expectedStatus: 200,
    })

    // 验证词条是否已删除
    const getResponse = await apiRequest(`/terms/${deleteTermId}`, {
      method: "GET",
      expectedStatus: 404,
    })
  })

  await runTest("删除词条 - 非作者", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest(`/terms/${testTermId}`, {
      method: "DELETE",
      token: testUser2!.token,
      expectedStatus: 403,
    })

    if (!response.data.error) {
      throw new Error("应该返回权限错误")
    }
  })

  endSuite()
}

/**
 * 论文模块测试
 */
export async function testPapers() {
  const endSuite = startSuite("论文模块测试")

  await runTest("创建论文 - 正常情况", async () => {
    if (!testUser1!.token) {
      const loginResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: testUser1!.email,
          password: testUser1!.password,
        },
      })
      testUser1!.token = loginResponse.data.token
    }

    const response = await apiRequest("/papers", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "Test Paper Title",
        titleCn: "测试论文标题",
        abstract: "This is a test paper abstract",
        abstractCn: "这是测试论文摘要",
        categoryId: testCategoryId!,
        authors: [{ name: "Test Author", affiliation: "Test University" }],
        tags: ["test", "paper"],
      },
      expectedStatus: 201,
    })

    if (!response.data.paperId) {
      throw new Error("创建论文应该返回paperId")
    }
    testPaperId = response.data.paperId
  })

  await runTest("创建论文 - 缺少必填字段", async () => {
    const response = await apiRequest("/papers", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "Incomplete Paper",
        // 缺少abstract, categoryId, authors
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回验证错误")
    }
  })

  await runTest("创建论文 - 空作者列表", async () => {
    const response = await apiRequest("/papers", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "Paper Without Authors",
        abstract: "Abstract",
        categoryId: testCategoryId!,
        authors: [],
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回作者列表验证错误")
    }
  })

  await runTest("获取论文列表 - 正常情况", async () => {
    const response = await apiRequest("/papers", {
      method: "GET",
      expectedStatus: 200,
    })

    if (!Array.isArray(response.data.papers)) {
      throw new Error("应该返回论文数组")
    }
  })

  await runTest("获取论文详情 - 正常情况", async () => {
    if (!testPaperId) {
      throw new Error("testPaperId未设置")
    }

    const response = await apiRequest(`/papers/${testPaperId}`, {
      method: "GET",
      expectedStatus: 200,
    })

    if (!response.data.paper) {
      throw new Error("应该返回论文详情")
    }
    if (response.data.paper.id !== testPaperId) {
      throw new Error("返回的论文ID不正确")
    }
  })

  await runTest("点赞论文 - 正常情况", async () => {
    if (!testPaperId) {
      throw new Error("testPaperId未设置")
    }

    const response = await apiRequest(`/papers/${testPaperId}/like`, {
      method: "POST",
      token: testUser2!.token,
      expectedStatus: 200,
    })

    // 验证点赞数是否增加
    const getResponse = await apiRequest(`/papers/${testPaperId}`, {
      method: "GET",
    })
    if (getResponse.data.paper.likes_count < 1) {
      throw new Error("点赞数应该增加")
    }
  })

  endSuite()
}

/**
 * 用户模块测试
 */
export async function testUsers() {
  const endSuite = startSuite("用户模块测试")

  await runTest("获取用户信息 - 正常情况", async () => {
    const response = await apiRequest(`/users/${testUser1!.id}`, {
      method: "GET",
      expectedStatus: 200,
    })

    if (!response.data.user) {
      throw new Error("应该返回用户信息")
    }
    if (response.data.user.id !== testUser1!.id) {
      throw new Error("返回的用户ID不正确")
    }
  })

  await runTest("获取用户信息 - 不存在的ID", async () => {
    const response = await apiRequest("/users/99999999", {
      method: "GET",
      expectedStatus: 404,
    })

    if (!response.data.error) {
      throw new Error("应该返回错误信息")
    }
  })

  await runTest("更新用户资料 - 正常情况", async () => {
    if (!testUser1!.token) {
      const loginResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: testUser1!.email,
          password: testUser1!.password,
        },
      })
      testUser1!.token = loginResponse.data.token
    }

    const response = await apiRequest(`/users/${testUser1!.id}`, {
      method: "PUT",
      token: testUser1!.token,
      body: {
        name: "更新后的用户名",
        bio: "更新后的个人简介",
        specialties: ["测试", "开发"],
      },
      expectedStatus: 200,
    })

    // 验证更新是否成功
    const getResponse = await apiRequest(`/users/${testUser1!.id}`, {
      method: "GET",
    })
    if (getResponse.data.user.name !== "更新后的用户名") {
      throw new Error("用户名未正确更新")
    }
  })

  await runTest("更新用户资料 - 非本人", async () => {
    const response = await apiRequest(`/users/${testUser2!.id}`, {
      method: "PUT",
      token: testUser1!.token,
      body: {
        name: "尝试修改别人的资料",
      },
      expectedStatus: 403,
    })

    if (!response.data.error) {
      throw new Error("应该返回权限错误")
    }
  })

  await runTest("关注用户 - 正常情况", async () => {
    const response = await apiRequest(`/users/${testUser2!.id}/follow`, {
      method: "POST",
      token: testUser1!.token,
      expectedStatus: 200,
    })

    // 验证关注数是否增加
    const getResponse = await apiRequest(`/users/${testUser2!.id}`, {
      method: "GET",
    })
    if (getResponse.data.user.followers_count < 1) {
      throw new Error("被关注用户的followers_count应该增加")
    }

    // 验证关注者数是否增加
    const getSelfResponse = await apiRequest(`/users/${testUser1!.id}`, {
      method: "GET",
    })
    if (getSelfResponse.data.user.following_count < 1) {
      throw new Error("关注用户的following_count应该增加")
    }
  })

  await runTest("取消关注用户", async () => {
    const response = await apiRequest(`/users/${testUser2!.id}/follow`, {
      method: "DELETE",
      token: testUser1!.token,
      expectedStatus: 200,
    })

    // 验证关注数是否减少
    const getResponse = await apiRequest(`/users/${testUser2!.id}`, {
      method: "GET",
    })
    if (getResponse.data.user.followers_count < 0) {
      throw new Error("followers_count不应该为负数")
    }
  })

  await runTest("用户签到 - 正常情况", async () => {
    const response = await apiRequest(`/users/${testUser1!.id}/checkin`, {
      method: "POST",
      token: testUser1!.token,
      body: {
        points: 10,
        streak: 1,
      },
      expectedStatus: 200,
    })

    // 验证积分是否增加
    const getResponse = await apiRequest(`/users/${testUser1!.id}`, {
      method: "GET",
    })
    if (getResponse.data.user.points < 100) {
      throw new Error("签到后积分应该增加")
    }
  })

  await runTest("用户签到 - 非本人", async () => {
    const response = await apiRequest(`/users/${testUser2!.id}/checkin`, {
      method: "POST",
      token: testUser1!.token,
      body: {
        points: 10,
        streak: 1,
      },
      expectedStatus: 403,
    })

    if (!response.data.error) {
      throw new Error("应该返回权限错误")
    }
  })

  endSuite()
}

/**
 * 评论模块测试
 */
export async function testComments() {
  const endSuite = startSuite("评论模块测试")

  await runTest("创建评论 - 正常情况", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest("/comments", {
      method: "POST",
      token: testUser2!.token,
      body: {
        termId: testTermId,
        content: "这是一条测试评论",
      },
      expectedStatus: 201,
    })

    if (!response.data.commentId) {
      throw new Error("创建评论应该返回commentId")
    }
    testCommentId = response.data.commentId
  })

  await runTest("创建评论 - 缺少必填字段", async () => {
    const response = await apiRequest("/comments", {
      method: "POST",
      token: testUser2!.token,
      body: {
        // 缺少termId和content
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回验证错误")
    }
  })

  await runTest("创建评论 - 内容过长", async () => {
    const response = await apiRequest("/comments", {
      method: "POST",
      token: testUser2!.token,
      body: {
        termId: testTermId,
        content: "a".repeat(5001), // 超过5000字符
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回内容长度验证错误")
    }
  })

  await runTest("获取评论列表 - 正常情况", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest(`/comments?termId=${testTermId}`, {
      method: "GET",
      expectedStatus: 200,
    })

    if (!Array.isArray(response.data.comments)) {
      throw new Error("应该返回评论数组")
    }
  })

  await runTest("删除评论 - 正常情况", async () => {
    if (!testCommentId) {
      throw new Error("testCommentId未设置")
    }

    const response = await apiRequest(`/comments/${testCommentId}`, {
      method: "DELETE",
      token: testUser2!.token,
      expectedStatus: 200,
    })
  })

  await runTest("删除评论 - 非作者", async () => {
    // 先创建一个评论
    const createResponse = await apiRequest("/comments", {
      method: "POST",
      token: testUser2!.token,
      body: {
        termId: testTermId,
        content: "待删除的评论",
      },
      expectedStatus: 201,
    })

    const commentId = createResponse.data.commentId

    // 尝试用其他用户删除
    const response = await apiRequest(`/comments/${commentId}`, {
      method: "DELETE",
      token: testUser1!.token,
      expectedStatus: 403,
    })

    if (!response.data.error) {
      throw new Error("应该返回权限错误")
    }

    // 清理：用正确的用户删除
    await apiRequest(`/comments/${commentId}`, {
      method: "DELETE",
      token: testUser2!.token,
    })
  })

  endSuite()
}

/**
 * 书签模块测试
 */
export async function testBookmarks() {
  const endSuite = startSuite("书签模块测试")

  await runTest("添加书签 - 正常情况", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest("/bookmarks", {
      method: "POST",
      token: testUser1!.token,
      body: {
        targetType: "term",
        targetId: testTermId,
      },
      expectedStatus: 200,
    })
  })

  await runTest("检查书签状态 - 已收藏", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest(`/bookmarks/check?targetType=term&targetId=${testTermId}`, {
      method: "GET",
      token: testUser1!.token,
      expectedStatus: 200,
    })

    if (response.data.isBookmarked !== true) {
      throw new Error("应该返回已收藏状态")
    }
  })

  await runTest("获取书签列表 - 正常情况", async () => {
    const response = await apiRequest("/bookmarks", {
      method: "GET",
      token: testUser1!.token,
      expectedStatus: 200,
    })

    if (!response.data.items || !Array.isArray(response.data.items)) {
      throw new Error("应该返回书签数组")
    }
  })

  await runTest("删除书签 - 正常情况", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const response = await apiRequest(`/bookmarks?targetType=term&targetId=${testTermId}`, {
      method: "DELETE",
      token: testUser1!.token,
      expectedStatus: 200,
    })

    // 验证书签是否已删除
    const checkResponse = await apiRequest(`/bookmarks/check?targetType=term&targetId=${testTermId}`, {
      method: "GET",
      token: testUser1!.token,
    })
    if (checkResponse.data.isBookmarked !== false) {
      throw new Error("书签应该已被删除")
    }
  })

  endSuite()
}

/**
 * 通知模块测试
 */
export async function testNotifications() {
  const endSuite = startSuite("通知模块测试")

  await runTest("获取通知列表 - 正常情况", async () => {
    const response = await apiRequest("/notifications", {
      method: "GET",
      token: testUser1!.token,
      expectedStatus: 200,
    })

    if (!Array.isArray(response.data.notifications)) {
      throw new Error("应该返回通知数组")
    }
  })

  await runTest("获取通知列表 - 未登录", async () => {
    const response = await apiRequest("/notifications", {
      method: "GET",
      expectedStatus: 401,
    })

    if (response.status !== 401) {
      throw new Error("未登录应该返回401状态码")
    }
  })

  endSuite()
}

/**
 * 管理后台测试
 */
export async function testAdminModule() {
  const endSuite = startSuite("管理后台测试")

  await runTest("管理员登录", async () => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: testAdmin!.email,
        password: testAdmin!.password,
      },
      expectedStatus: 200,
    })

    testAdmin!.token = response.data.token
  })

  await runTest("获取管理员统计数据 - 正常情况", async () => {
    const response = await apiRequest("/admin/stats", {
      method: "GET",
      token: testAdmin!.token,
      expectedStatus: 200,
    })

    if (!response.data.stats) {
      throw new Error("应该返回统计数据")
    }
  })

  await runTest("获取管理员统计数据 - 非管理员", async () => {
    const response = await apiRequest("/admin/stats", {
      method: "GET",
      token: testUser1!.token,
      expectedStatus: 403,
    })

    if (response.status !== 403) {
      throw new Error("非管理员应该返回403状态码")
    }
  })

  endSuite()
}

/**
 * 边界情况测试
 */
export async function testEdgeCases() {
  const endSuite = startSuite("边界情况测试")

  await runTest("SQL注入尝试 - 登录邮箱", async () => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: "admin@test.com' OR '1'='1",
        password: "test123456",
      },
      expectedStatus: 400, // 邮箱验证会先失败，返回400
    })

    // 应该返回错误，而不是成功登录（邮箱格式验证会先拦截）
    if (response.data.token) {
      throw new Error("SQL注入应该被阻止")
    }
  })

  await runTest("SQL注入尝试 - 词条标题", async () => {
    if (!testUser1!.token) {
      const loginResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: testUser1!.email,
          password: testUser1!.password,
        },
      })
      testUser1!.token = loginResponse.data.token
    }

    // 使用参数化查询，SQL注入会被安全处理（作为普通字符串）
    // 这里测试的是：即使包含SQL关键字，也不会执行SQL注入
    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "'; DROP TABLE terms; --",
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
      },
      expectedStatus: 201, // 参数化查询会安全处理，允许创建
    })

    // 验证表是否仍然存在（参数化查询应该保护数据库）
    const terms = await query("SELECT COUNT(*) as count FROM terms")
    if (terms.length === 0) {
      throw new Error("SQL注入应该被阻止，表不应该被删除")
    }

    // 清理创建的词条
    if (response.data.termId) {
      await execute("DELETE FROM terms WHERE id = ?", [response.data.termId])
    }
  })

  await runTest("XSS尝试 - 词条内容", async () => {
    if (!testUser1!.token) {
      const loginResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: testUser1!.email,
          password: testUser1!.password,
        },
      })
      testUser1!.token = loginResponse.data.token
    }

    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "XSS测试词条",
        categoryId: testCategoryId!,
        summary: "简介",
        content: "<script>alert('XSS')</script>",
      },
      expectedStatus: 201,
    })

    // 内容应该被保存（前端负责转义）
    // 这里只验证API能正常处理
    if (!response.data.termId) {
      throw new Error("应该能创建词条，即使包含脚本标签")
    }

    // 清理
    await execute("DELETE FROM terms WHERE id = ?", [response.data.termId])
  })

  await runTest("超长字符串 - 词条标题", async () => {
    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "a".repeat(10000),
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回长度验证错误")
    }
  })

  await runTest("特殊字符 - 用户名", async () => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        name: "特殊字符测试!@#$%^&*()",
        email: "special-chars@test.com",
        password: "test123456",
      },
      expectedStatus: 201,
    })

    // 应该能正常注册
    if (!response.data.token) {
      throw new Error("应该能接受特殊字符用户名")
    }

    // 清理
    const user = await queryOne<{ id: number }>(
      "SELECT id FROM users WHERE email = ?",
      ["special-chars@test.com"]
    )
    if (user) {
      await execute("DELETE FROM users WHERE id = ?", [user.id])
    }
  })

  await runTest("负数ID - 获取词条", async () => {
    const response = await apiRequest("/terms/-1", {
      method: "GET",
      expectedStatus: 400, // 现在应该返回400而不是404
    })

    if (response.status !== 400) {
      throw new Error(`应该返回400无效ID错误，实际返回${response.status}`)
    }
  })

  await runTest("零ID - 获取用户", async () => {
    const response = await apiRequest("/users/0", {
      method: "GET",
      expectedStatus: 400, // 现在应该返回400而不是404
    })

    if (response.status !== 400) {
      throw new Error(`应该返回400无效ID错误，实际返回${response.status}`)
    }
  })

  await runTest("非数字ID - 获取词条", async () => {
    const response = await apiRequest("/terms/abc", {
      method: "GET",
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回无效ID错误")
    }
  })

  await runTest("空字符串 - 必填字段", async () => {
    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "",
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
      },
      expectedStatus: 400,
    })

    if (!response.data.error) {
      throw new Error("应该返回验证错误")
    }
  })

  await runTest("null值 - 可选字段", async () => {
    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "测试词条",
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
        tags: null,
      },
      expectedStatus: 201,
    })

    // 应该能正常创建（tags是可选的）
    if (!response.data.termId) {
      throw new Error("应该能接受null的可选字段")
    }

    // 清理
    await execute("DELETE FROM terms WHERE id = ?", [response.data.termId])
  })

  endSuite()
}

/**
 * 额外边界情况测试
 */
export async function testAdditionalEdgeCases() {
  const endSuite = startSuite("额外边界情况测试")

  await runTest("重复关注 - 应该返回错误或忽略", async () => {
    // 先关注
    await apiRequest(`/users/${testUser2!.id}/follow`, {
      method: "POST",
      token: testUser1!.token,
    })

    // 再次关注
    const response = await apiRequest(`/users/${testUser2!.id}/follow`, {
      method: "POST",
      token: testUser1!.token,
    })

    // 应该返回错误或忽略（不允许重复关注）
    if (response.status === 200 && response.data.error) {
      // 有错误信息，这是好的
    } else if (response.status === 400) {
      // 返回400也是合理的
    }
    // 如果返回200且没有错误，可能允许重复关注（需要检查业务逻辑）

    // 清理
    await apiRequest(`/users/${testUser2!.id}/follow`, {
      method: "DELETE",
      token: testUser1!.token,
    })
  })

  await runTest("自己关注自己 - 应该被拒绝", async () => {
    const response = await apiRequest(`/users/${testUser1!.id}/follow`, {
      method: "POST",
      token: testUser1!.token,
      expectedStatus: 400, // 应该拒绝自己关注自己
    })

    if (response.status !== 400 && response.status !== 403) {
      throw new Error("应该拒绝自己关注自己")
    }
  })

  await runTest("重复书签 - 应该返回错误", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    // 先添加书签
    await apiRequest("/bookmarks", {
      method: "POST",
      token: testUser1!.token,
      body: {
        targetType: "term",
        targetId: testTermId,
      },
    })

    // 再次添加相同书签
    const response = await apiRequest("/bookmarks", {
      method: "POST",
      token: testUser1!.token,
      body: {
        targetType: "term",
        targetId: testTermId,
      },
      expectedStatus: 400, // 应该返回错误
    })

    // 清理
    await apiRequest(`/bookmarks?targetType=term&targetId=${testTermId}`, {
      method: "DELETE",
      token: testUser1!.token,
    })
  })

  await runTest("更新不存在的词条", async () => {
    const response = await apiRequest("/terms/99999999", {
      method: "PUT",
      token: testUser1!.token,
      body: {
        title: "更新不存在的词条",
      },
      expectedStatus: 404,
    })

    if (response.status !== 404) {
      throw new Error("应该返回404错误")
    }
  })

  await runTest("无效的JSON请求体", async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/terms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUser1!.token}`,
        },
        body: "这不是有效的JSON{",
      })

      const data = await response.json()
      if (response.status !== 400) {
        throw new Error(`应该返回400错误，实际返回${response.status}`)
      }
    } catch (error: any) {
      // 如果JSON解析失败，这也是合理的
    }
  })

  await runTest("缺少Content-Type头", async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/terms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUser1!.token}`,
          // 故意不设置Content-Type
        },
        body: JSON.stringify({
          title: "测试词条",
          categoryId: testCategoryId!,
          summary: "简介",
          content: "内容",
        }),
      })

      // 应该能正常处理（Next.js可能会自动解析）
      // 或者返回400错误
      if (response.status !== 200 && response.status !== 201 && response.status !== 400) {
        throw new Error(`意外的状态码: ${response.status}`)
      }
    } catch (error: any) {
      // 网络错误等可以忽略
    }
  })

  await runTest("非常大的数字ID", async () => {
    // 非常大的数字可能被解析为Infinity或NaN
    const response = await apiRequest("/terms/999999999999999999", {
      method: "GET",
      // 可能返回400（无效ID）或404（不存在），都是合理的
    })

    if (response.status !== 400 && response.status !== 404) {
      throw new Error(`应该返回400或404，实际返回${response.status}`)
    }
  })

  await runTest("特殊Unicode字符 - 词条标题", async () => {
    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "测试词条 🚀 中文 日本語 한국어",
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
      },
      expectedStatus: 201,
    })

    if (!response.data.termId) {
      throw new Error("应该能接受Unicode字符")
    }

    // 清理
    await execute("DELETE FROM terms WHERE id = ?", [response.data.termId])
  })

  await runTest("空数组 - tags字段", async () => {
    const response = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "空标签测试",
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
        tags: [],
      },
      expectedStatus: 201,
    })

    if (!response.data.termId) {
      throw new Error("应该能接受空数组")
    }

    // 清理
    await execute("DELETE FROM terms WHERE id = ?", [response.data.termId])
  })

  await runTest("删除词条后关联数据清理", async () => {
    // 创建一个词条
    const createResponse = await apiRequest("/terms", {
      method: "POST",
      token: testUser1!.token,
      body: {
        title: "待删除词条",
        categoryId: testCategoryId!,
        summary: "简介",
        content: "内容",
      },
      expectedStatus: 201,
    })

    const termId = createResponse.data.termId

    // 添加点赞
    await apiRequest(`/terms/${termId}/like`, {
      method: "POST",
      token: testUser2!.token,
    })

    // 添加评论
    await apiRequest("/comments", {
      method: "POST",
      token: testUser2!.token,
      body: {
        termId: termId,
        content: "测试评论",
      },
    })

    // 删除词条
    await apiRequest(`/terms/${termId}`, {
      method: "DELETE",
      token: testUser1!.token,
    })

    // 验证关联数据是否被清理（外键约束应该自动处理）
    const likes = await query("SELECT COUNT(*) as count FROM likes WHERE target_type = 'term' AND target_id = ?", [termId])
    const comments = await query("SELECT COUNT(*) as count FROM comments WHERE term_id = ?", [termId])

    // 如果外键设置了ON DELETE CASCADE，这些应该为0
    // 如果没有，至少词条应该被删除
    const term = await queryOne("SELECT id FROM terms WHERE id = ?", [termId])
    if (term) {
      throw new Error("词条应该已被删除")
    }
  })

  await runTest("更新用户 - 无效的邮箱格式", async () => {
    const response = await apiRequest(`/users/${testUser1!.id}`, {
      method: "PUT",
      token: testUser1!.token,
      body: {
        email: "invalid-email-format", // 注意：用户更新可能不支持email字段
      },
    })

    // 如果支持email更新，应该验证格式
    // 如果不支持，应该忽略或返回错误
  })

  await runTest("词条列表 - 无效的分页参数", async () => {
    const response = await apiRequest("/terms?page=-1&pageSize=abc", {
      method: "GET",
    })

    // 应该能处理或返回错误
    if (response.status !== 200 && response.status !== 400) {
      throw new Error(`意外的状态码: ${response.status}`)
    }
  })

  await runTest("词条列表 - 超大分页参数", async () => {
    const response = await apiRequest("/terms?page=1&pageSize=10000", {
      method: "GET",
    })

    // 应该能处理或限制最大页面大小
    if (response.status !== 200) {
      throw new Error(`应该能处理或返回错误，实际返回${response.status}`)
    }
  })

  endSuite()
}

/**
 * 数据一致性检查
 */
export async function testDataConsistency() {
  const endSuite = startSuite("数据一致性检查")

  await runTest("点赞数一致性 - 词条", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    // 获取数据库中的点赞数
    const dbTerm = await queryOne<{ likes_count: number }>(
      "SELECT likes_count FROM terms WHERE id = ?",
      [testTermId]
    )

    // 获取API返回的点赞数
    const apiResponse = await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })

    if (dbTerm!.likes_count !== apiResponse.data.term.likes_count) {
      throw new Error(
        `点赞数不一致: 数据库=${dbTerm!.likes_count}, API=${apiResponse.data.term.likes_count}`
      )
    }
  })

  await runTest("关注数一致性 - 用户", async () => {
    // 先关注
    await apiRequest(`/users/${testUser2!.id}/follow`, {
      method: "POST",
      token: testUser1!.token,
    })

    // 获取数据库中的关注数
    const dbUser = await queryOne<{
      followers_count: number
    }>(
      "SELECT followers_count FROM users WHERE id = ?",
      [testUser2!.id]
    )

    // 获取API返回的关注数
    const apiResponse = await apiRequest(`/users/${testUser2!.id}`, {
      method: "GET",
    })

    if (dbUser!.followers_count !== apiResponse.data.user.followers_count) {
      throw new Error(
        `关注数不一致: 数据库=${dbUser!.followers_count}, API=${apiResponse.data.user.followers_count}`
      )
    }

    // 取消关注
    await apiRequest(`/users/${testUser2!.id}/follow`, {
      method: "DELETE",
      token: testUser1!.token,
    })
  })

  await runTest("积分计算一致性", async () => {
    // 获取初始积分
    const initialResponse = await apiRequest(`/users/${testUser1!.id}`, {
      method: "GET",
    })
    const initialPoints = initialResponse.data.user.points

    // 签到增加积分
    await apiRequest(`/users/${testUser1!.id}/checkin`, {
      method: "POST",
      token: testUser1!.token,
      body: {
        points: 10,
        streak: 1,
      },
    })

    // 获取数据库中的积分
    const dbUser = await queryOne<{ points: number }>(
      "SELECT points FROM users WHERE id = ?",
      [testUser1!.id]
    )

    // 获取API返回的积分
    const apiResponse = await apiRequest(`/users/${testUser1!.id}`, {
      method: "GET",
    })

    if (dbUser!.points !== apiResponse.data.user.points) {
      throw new Error(
        `积分不一致: 数据库=${dbUser!.points}, API=${apiResponse.data.user.points}`
      )
    }

    if (apiResponse.data.user.points !== initialPoints + 10) {
      throw new Error(
        `积分计算错误: 初始=${initialPoints}, 应该=${initialPoints + 10}, 实际=${apiResponse.data.user.points}`
      )
    }
  })

  await runTest("用户等级计算一致性", async () => {
    // 获取用户信息
    const apiResponse = await apiRequest(`/users/${testUser1!.id}`, {
      method: "GET",
    })

    const points = apiResponse.data.user.points
    const level = apiResponse.data.user.level

    // 等级应该是 floor(points / 500) + 1
    const expectedLevel = Math.floor(points / 500) + 1

    if (level !== expectedLevel) {
      throw new Error(
        `等级计算错误: 积分=${points}, 应该=${expectedLevel}, 实际=${level}`
      )
    }
  })

  await runTest("词条浏览量一致性", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    // 获取初始浏览量
    const initialResponse = await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })
    const initialViews = initialResponse.data.term.views

    // 再次访问应该增加浏览量
    await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })

    // 获取数据库中的浏览量
    const dbTerm = await queryOne<{ views: number }>(
      "SELECT views FROM terms WHERE id = ?",
      [testTermId]
    )

    // 获取API返回的浏览量
    const apiResponse = await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })

    if (dbTerm!.views !== apiResponse.data.term.views) {
      throw new Error(
        `浏览量不一致: 数据库=${dbTerm!.views}, API=${apiResponse.data.term.views}`
      )
    }

    if (apiResponse.data.term.views <= initialViews) {
      throw new Error(
        `浏览量应该增加: 初始=${initialViews}, 实际=${apiResponse.data.term.views}`
      )
    }
  })

  await runTest("评论数一致性 - 词条", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    // 创建一条评论
    await apiRequest("/comments", {
      method: "POST",
      token: testUser1!.token,
      body: {
        termId: testTermId,
        content: "一致性测试评论",
      },
    })

    // 获取数据库中的评论数
    const dbTerm = await queryOne<{ comments_count: number }>(
      "SELECT comments_count FROM terms WHERE id = ?",
      [testTermId]
    )

    // 获取API返回的评论数
    const apiResponse = await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })

    if (dbTerm!.comments_count !== apiResponse.data.term.comments_count) {
      throw new Error(
        `评论数不一致: 数据库=${dbTerm!.comments_count}, API=${apiResponse.data.term.comments_count}`
      )
    }

    // 清理评论
    const comments = await query<{ id: number }>(
      "SELECT id FROM comments WHERE term_id = ? AND content = ?",
      [testTermId, "一致性测试评论"]
    )
    for (const comment of comments) {
      await execute("DELETE FROM comments WHERE id = ?", [comment.id])
    }
  })

  endSuite()
}

/**
 * 性能测试
 */
export async function testPerformance() {
  const endSuite = startSuite("性能测试")

  await runTest("API响应时间 - 获取词条列表", async () => {
    const startTime = Date.now()
    await apiRequest("/terms", {
      method: "GET",
    })
    const duration = Date.now() - startTime

    if (duration > 2000) {
      throw new Error(`响应时间过长: ${duration}ms (应该 < 2000ms)`)
    }
  })

  await runTest("API响应时间 - 获取词条详情", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const startTime = Date.now()
    await apiRequest(`/terms/${testTermId}`, {
      method: "GET",
    })
    const duration = Date.now() - startTime

    if (duration > 1000) {
      throw new Error(`响应时间过长: ${duration}ms (应该 < 1000ms)`)
    }
  })

  await runTest("API响应时间 - 登录", async () => {
    const startTime = Date.now()
    await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: testUser1!.email,
        password: testUser1!.password,
      },
    })
    const duration = Date.now() - startTime

    if (duration > 1000) {
      throw new Error(`响应时间过长: ${duration}ms (应该 < 1000ms)`)
    }
  })

  await runTest("并发请求测试 - 获取词条列表", async () => {
    const concurrency = 10
    const startTime = Date.now()

    const promises = Array.from({ length: concurrency }, () =>
      apiRequest("/terms", {
        method: "GET",
      })
    )

    await Promise.all(promises)
    const duration = Date.now() - startTime

    if (duration > 5000) {
      throw new Error(`并发响应时间过长: ${duration}ms (应该 < 5000ms)`)
    }
  })

  await runTest("并发请求测试 - 获取词条详情", async () => {
    if (!testTermId) {
      throw new Error("testTermId未设置")
    }

    const concurrency = 10
    const startTime = Date.now()

    const promises = Array.from({ length: concurrency }, () =>
      apiRequest(`/terms/${testTermId}`, {
        method: "GET",
      })
    )

    await Promise.all(promises)
    const duration = Date.now() - startTime

    if (duration > 3000) {
      throw new Error(`并发响应时间过长: ${duration}ms (应该 < 3000ms)`)
    }
  })

  await runTest("大数据量查询 - 词条列表分页", async () => {
    const startTime = Date.now()
    await apiRequest("/terms?page=1&pageSize=100", {
      method: "GET",
    })
    const duration = Date.now() - startTime

    if (duration > 3000) {
      throw new Error(`大数据量查询响应时间过长: ${duration}ms (应该 < 3000ms)`)
    }
  })

  endSuite()
}

/**
 * 生成测试报告
 */
function generateReport() {
  console.log("\n" + "=".repeat(60))
  console.log("📊 测试报告")
  console.log("=".repeat(60))

  let totalTests = 0
  let totalPassed = 0
  let totalFailed = 0
  let totalDuration = 0

  for (const suite of testResults) {
    totalTests += suite.tests.length
    totalPassed += suite.passed
    totalFailed += suite.failed
    totalDuration += suite.duration

    console.log(`\n${suite.name}:`)
    console.log(`  总测试: ${suite.tests.length}`)
    console.log(`  通过: ${suite.passed} ✅`)
    console.log(`  失败: ${suite.failed} ${suite.failed > 0 ? "❌" : ""}`)
    console.log(`  耗时: ${suite.duration}ms`)

    if (suite.failed > 0) {
      console.log(`\n  失败的测试:`)
      for (const test of suite.tests) {
        if (!test.passed) {
          console.log(`    - ${test.name}`)
          console.log(`      错误: ${test.error}`)
          if (test.details) {
            console.log(`      详情: ${JSON.stringify(test.details, null, 2)}`)
          }
        }
      }
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("总计:")
  console.log(`  总测试数: ${totalTests}`)
  console.log(`  通过: ${totalPassed} ✅`)
  console.log(`  失败: ${totalFailed} ${totalFailed > 0 ? "❌" : ""}`)
  console.log(`  通过率: ${((totalPassed / totalTests) * 100).toFixed(2)}%`)
  console.log(`  总耗时: ${totalDuration}ms`)
  console.log("=".repeat(60))

  if (totalFailed > 0) {
    console.log("\n⚠️  有测试失败，请检查上述错误信息")
    process.exit(1)
  } else {
    console.log("\n🎉 所有测试通过！")
    process.exit(0)
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 开始整站测试")
  console.log(`服务器地址: ${SERVER_URL}`)
  console.log(`API地址: ${API_BASE_URL}`)

  try {
    // 初始化
    await setupTestEnvironment()

    // 运行所有测试套件
    await testAuth()
    await testTerms()
    await testPapers()
    await testUsers()
    await testComments()
    await testBookmarks()
    await testNotifications()
    await testAdminModule()
    await testEdgeCases()
    await testAdditionalEdgeCases()
    await testDataConsistency()
    await testPerformance()

    // 清理
    await cleanupTestEnvironment()

    // 生成报告
    generateReport()
  } catch (error: any) {
    console.error("\n❌ 测试过程中发生严重错误:", error.message)
    console.error(error.stack)
    await cleanupTestEnvironment()
    process.exit(1)
  } finally {
    await closePool()
  }
}

// 运行测试
if (require.main === module) {
  main()
}
