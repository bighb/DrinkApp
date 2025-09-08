// API类型定义
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 用户相关类型
export interface User {
  id: number
  email: string
  username: string
  fullName?: string
  avatarUrl?: string
  emailVerified: boolean
  isPremium: boolean
  timezone?: string
  locale?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  dateOfBirth?: string
  height?: number
  weight?: number
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  createdAt: string
  updatedAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface LoginRequest {
  login: string // 邮箱或用户名
  password: string
  deviceInfo?: {
    id: string
    name: string
    type: string
    platform: string
  }
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  fullName?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  dateOfBirth?: string
  height?: number
  weight?: number
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface RegisterResponse {
  userId: number
  email: string
  username: string
  verificationSent: boolean
}

// 饮水记录类型
export interface HydrationRecord {
  id: number
  amount: number
  drinkType: 'water' | 'tea' | 'coffee' | 'juice' | 'sports_drink' | 'soda' | 'alcohol' | 'other'
  drinkName?: string
  recordedAt: string
  location?: string
  activityContext?: 'work' | 'exercise' | 'meal' | 'wake_up' | 'before_sleep' | 'break' | 'other'
  temperature?: 'hot' | 'warm' | 'room' | 'cold' | 'iced'
  source: 'manual' | 'quick_add' | 'reminder_response' | 'smart_cup' | 'api_import'
  createdAt: string
  updatedAt?: string
}

export interface TodayProgress {
  date: string
  progress: {
    current: number
    goal: number
    percentage: string
    remaining: number
    isGoalAchieved: boolean
  }
  statistics: {
    totalRecords: number
    lastRecordTime?: string
    timeDistribution: {
      morning: number
      afternoon: number
      evening: number
    }
    drinkDistribution: {
      water: number
      tea: number
      coffee: number
      other: number
    }
  }
  records: HydrationRecord[]
  recommendations?: {
    nextReminderTime?: string
    suggestedAmount?: number
  }
}