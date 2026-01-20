"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  bio: string
  contributions: number
  followers: number
  following: number
  points: number
  level: number
  badges: Badge[]
  specialties: string[]
  joinedAt: string
  isVerified: boolean
  streak: number // 连续签到天数
  lastCheckIn?: string
  role: 'user' | 'admin' // 用户角色（向后兼容）
  permissions?: string[] // 用户权限列表
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earnedAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<User>) => void
  checkIn: () => Promise<{ success: boolean; points: number }>
  addPoints: (points: number, reason: string) => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 将数据库用户数据转换为前端 User 格式
function transformUser(dbUser: any): User {
  return {
    id: dbUser.id.toString(),
    name: dbUser.name,
    email: dbUser.email,
    avatar: dbUser.avatar || "",
    bio: dbUser.bio || "",
    contributions: dbUser.contributions || 0,
    followers: dbUser.followers_count || 0,
    following: dbUser.following_count || 0,
    points: dbUser.points || 0,
    level: dbUser.level || 1,
    badges: (dbUser.badges || []).map((b: any) => ({
      id: b.id || b.badge_id,
      name: b.name || b.badge_name,
      icon: b.icon || "",
      description: b.description || "",
      earnedAt: b.earnedAt || b.earned_at,
    })),
    specialties: dbUser.specialties || [],
    joinedAt: dbUser.joined_at || new Date().toISOString(),
    isVerified: dbUser.is_verified || false,
    streak: dbUser.streak || 0,
    lastCheckIn: dbUser.last_check_in || undefined,
    role: dbUser.role || 'user',
    permissions: dbUser.permissions || [],
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("gaoneng_token")
    if (token) {
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("gaoneng_token")
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(transformUser(data.user))
      } else {
        // Token 无效，清除
        localStorage.removeItem("gaoneng_token")
        setUser(null)
      }
    } catch (error) {
      console.error("Fetch user error:", error)
      localStorage.removeItem("gaoneng_token")
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("gaoneng_token", data.token)
        setUser(transformUser(data.user))
        setIsLoading(false)
        return true
      } else {
        const error = await response.json()
        console.error("Login error:", error)
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("gaoneng_token", data.token)
        
        // 获取完整用户信息
        const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        })
        
        if (meResponse.ok) {
          const meData = await meResponse.json()
          setUser(transformUser(meData.user))
        } else {
          setUser({
            id: data.user.id.toString(),
            name: data.user.name,
            email: data.user.email,
            avatar: "",
            bio: "",
            contributions: 0,
            followers: 0,
            following: 0,
            points: 100,
            level: 1,
            badges: [],
            specialties: [],
            joinedAt: new Date().toISOString(),
            isVerified: false,
            streak: 0,
          })
        }
        
        setIsLoading(false)
        return true
      } else {
        const error = await response.json()
        console.error("Register error:", error)
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error("Register error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem("gaoneng_token")
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      localStorage.removeItem("gaoneng_token")
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return

    try {
      const token = localStorage.getItem("gaoneng_token")
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        // 重新获取用户信息
        await fetchUser()
      }
    } catch (error) {
      console.error("Update profile error:", error)
    }
  }

  const checkIn = async (): Promise<{ success: boolean; points: number }> => {
    if (!user) return { success: false, points: 0 }

    try {
      const token = localStorage.getItem("gaoneng_token")
      if (!token) return { success: false, points: 0 }

      const today = new Date().toISOString().split("T")[0]
      if (user.lastCheckIn === today) {
        return { success: false, points: 0 }
      }

      // 计算连续签到奖励
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
      const isConsecutive = user.lastCheckIn === yesterday
      const newStreak = isConsecutive ? user.streak + 1 : 1
      const basePoints = 10
      const bonusPoints = Math.min(newStreak, 7) * 5

      const totalPoints = basePoints + bonusPoints

      // 更新用户信息
      const response = await fetch(`${API_BASE_URL}/users/${user.id}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: totalPoints, streak: newStreak }),
      })

      if (response.ok) {
        await fetchUser()
        return { success: true, points: totalPoints }
      }

      return { success: false, points: 0 }
    } catch (error) {
      console.error("Check in error:", error)
      return { success: false, points: 0 }
    }
  }

  const addPoints = async (points: number, reason: string) => {
    if (!user) return

    try {
      const token = localStorage.getItem("gaoneng_token")
      if (!token) return

      const newPoints = user.points + points
      const newLevel = Math.floor(newPoints / 500) + 1

      await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: newPoints, level: newLevel }),
      })

      await fetchUser()
      console.log(`[Points] +${points} for ${reason}`)
    } catch (error) {
      console.error("Add points error:", error)
    }
  }

  // 权限检查函数
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false
    return user.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user || !user.permissions) return false
    return permissions.some(perm => user.permissions!.includes(perm))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user || !user.permissions) return false
    return permissions.every(perm => user.permissions!.includes(perm))
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout, 
      updateProfile, 
      checkIn, 
      addPoints,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
