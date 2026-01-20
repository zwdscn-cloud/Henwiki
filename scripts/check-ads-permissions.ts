/**
 * 检查广告管理权限
 * 运行方式: npx tsx scripts/check-ads-permissions.ts
 */

import { query } from "../lib/db/connection"
import { closePool } from "../lib/db/connection"

async function checkPermissions() {
  try {
    console.log("🔍 检查广告管理权限配置...\n")

    // 1. 检查权限是否存在
    console.log("1. 检查权限定义...")
    const permissions = await query<any>(
      `SELECT code, name FROM permissions WHERE code LIKE 'admin.ads.%' ORDER BY code`
    )
    
    if (permissions.length === 0) {
      console.log("  ❌ 未找到广告管理权限！")
      console.log("  💡 请运行: npx tsx scripts/setup-ads-module.ts")
      return
    }
    
    console.log(`  ✅ 找到 ${permissions.length} 个权限:`)
    permissions.forEach(p => {
      console.log(`     - ${p.code}: ${p.name}`)
    })

    // 2. 检查角色权限关联
    console.log("\n2. 检查角色权限关联...")
    const rolePermissions = await query<any>(
      `SELECT r.code as role_code, r.name as role_name, p.code as permission_code
       FROM roles r
       INNER JOIN role_permissions rp ON r.id = rp.role_id
       INNER JOIN permissions p ON rp.permission_id = p.id
       WHERE p.code LIKE 'admin.ads.%'
       ORDER BY r.code, p.code`
    )
    
    if (rolePermissions.length === 0) {
      console.log("  ❌ 未找到角色权限关联！")
      console.log("  💡 请运行: npx tsx scripts/setup-ads-module.ts")
      return
    }
    
    console.log(`  ✅ 找到 ${rolePermissions.length} 个角色权限关联:`)
    const roleMap = new Map<string, string[]>()
    rolePermissions.forEach(rp => {
      if (!roleMap.has(rp.role_code)) {
        roleMap.set(rp.role_code, [])
      }
      roleMap.get(rp.role_code)!.push(rp.permission_code)
    })
    
    roleMap.forEach((perms, role) => {
      console.log(`     ${role}: ${perms.length} 个权限`)
    })

    // 3. 检查用户角色
    console.log("\n3. 检查用户角色...")
    const users = await query<any>(
      `SELECT u.id, u.name, u.email, r.code as role_code, r.name as role_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE r.code IN ('admin', 'super_admin')
       ORDER BY u.id`
    )
    
    if (users.length === 0) {
      console.log("  ⚠️  未找到管理员用户")
      console.log("  💡 请确保至少有一个用户被分配了 admin 或 super_admin 角色")
    } else {
      console.log(`  ✅ 找到 ${users.length} 个管理员用户:`)
      users.forEach(u => {
        console.log(`     - ${u.name} (${u.email}): ${u.role_code || '无角色'}`)
      })
    }

    // 4. 检查具体用户的权限
    console.log("\n4. 检查用户权限...")
    const userPermissions = await query<any>(
      `SELECT u.id, u.name, u.email, p.code as permission_code
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.id
       INNER JOIN role_permissions rp ON r.id = rp.role_id
       INNER JOIN permissions p ON rp.permission_id = p.id
       WHERE p.code = 'admin.ads.view'
       ORDER BY u.id`
    )
    
    if (userPermissions.length === 0) {
      console.log("  ❌ 没有用户拥有 admin.ads.view 权限！")
      console.log("  💡 可能的原因:")
      console.log("     1. 用户没有分配管理员角色")
      console.log("     2. 角色权限关联未正确设置")
      console.log("  💡 解决方案:")
      console.log("     1. 运行: npx tsx scripts/setup-ads-module.ts")
      console.log("     2. 确保用户被分配了 admin 或 super_admin 角色")
    } else {
      console.log(`  ✅ 找到 ${userPermissions.length} 个用户拥有 admin.ads.view 权限:`)
      const userMap = new Map<number, { name: string; email: string }>()
      userPermissions.forEach(up => {
        if (!userMap.has(up.id)) {
          userMap.set(up.id, { name: up.name, email: up.email })
        }
      })
      
      userMap.forEach((info, id) => {
        console.log(`     - ${info.name} (${info.email})`)
      })
      
      console.log("\n  💡 如果这些用户仍然看不到菜单，请:")
      console.log("     1. 刷新浏览器页面")
      console.log("     2. 或者退出登录后重新登录")
      console.log("     3. 清除浏览器缓存")
    }

    console.log("\n✅ 检查完成！")
    
  } catch (error: any) {
    console.error("❌ 检查失败:", error.message)
    console.error(error)
  } finally {
    await closePool()
  }
}

checkPermissions()
