import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User, LoginRequest, RegisterRequest, ApiResponse, LoginResponse, RegisterResponse } from '../api/types'
import { AuthApi } from '../api/auth'
import { TokenManager, ApiErrorHandler } from '../api/client'

// 认证状态接口
interface AuthState {
  // 状态
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // 操作方法
  login: (data: Omit<LoginRequest, 'deviceInfo'>) => Promise<boolean>
  register: (data: RegisterRequest) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
  checkAuthStatus: () => Promise<void>
  updateUser: (user: Partial<User>) => void

  // 内部方法
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUser: (user: User | null) => void
}

// 存储键
const USER_DATA_KEY = 'user_data'

// 用户数据持久化
const UserStorage = {
  async save(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
    } catch (error) {
      console.error('保存用户数据失败:', error)
    }
  },

  async load(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(USER_DATA_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('加载用户数据失败:', error)
      return null
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY)
    } catch (error) {
      console.error('清除用户数据失败:', error)
    }
  },
}

// 创建认证store
export const useAuthStore = create<AuthState>((set, get) => ({
  // 初始状态
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // 设置加载状态
  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  // 设置错误信息
  setError: (error: string | null) => {
    set({ error })
  },

  // 设置用户信息
  setUser: (user: User | null) => {
    set({ 
      user, 
      isAuthenticated: !!user 
    })
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  },

  // 更新用户信息
  updateUser: (userData: Partial<User>) => {
    const { user } = get()
    if (user) {
      const updatedUser = { ...user, ...userData }
      set({ user: updatedUser })
      UserStorage.save(updatedUser)
    }
  },

  // 用户登录
  login: async (loginData: Omit<LoginRequest, 'deviceInfo'>): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null })

      const response: ApiResponse<LoginResponse> = await AuthApi.login(loginData)

      if (response.success && response.data) {
        const { user, tokens } = response.data
        
        // 保存令牌
        await TokenManager.saveTokens(tokens.accessToken, tokens.refreshToken)
        
        // 保存用户数据
        await UserStorage.save(user)
        
        // 更新状态
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false,
          error: null 
        })

        return true
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error)
      set({ 
        error: errorMessage, 
        isLoading: false,
        isAuthenticated: false,
        user: null
      })
      return false
    }
  },

  // 用户注册
  register: async (registerData: RegisterRequest): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null })

      const response: ApiResponse<RegisterResponse> = await AuthApi.register(registerData)

      if (response.success && response.data) {
        set({ 
          isLoading: false,
          error: null
        })

        // 注册成功，可以显示验证提示
        // 注意：注册后通常不直接登录，需要邮箱验证
        return true
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error)
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      return false
    }
  },

  // 用户登出
  logout: async (): Promise<void> => {
    try {
      set({ isLoading: true })

      // 调用后端登出API
      try {
        await AuthApi.logout()
      } catch (error) {
        // 即使后端登出失败，也要清除本地数据
        console.warn('后端登出失败，但继续清除本地数据:', error)
      }

      // 清除本地数据
      await TokenManager.clearTokens()
      await UserStorage.clear()

      // 更新状态
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      console.error('登出过程中出错:', error)
      // 即使出错也要清除状态
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },

  // 检查认证状态
  checkAuthStatus: async (): Promise<void> => {
    const { setLoading, setUser } = get()
    
    try {
      setLoading(true)

      // 检查是否有令牌
      const hasTokens = await TokenManager.hasTokens()
      
      if (!hasTokens) {
        set({ 
          isAuthenticated: false, 
          user: null, 
          isLoading: false 
        })
        return
      }

      // 尝试加载本地用户数据
      const user = await UserStorage.load()
      
      if (user) {
        setUser(user)
        set({ isLoading: false })
      } else {
        // 如果有令牌但没有用户数据，清除令牌
        await TokenManager.clearTokens()
        set({ 
          isAuthenticated: false, 
          user: null, 
          isLoading: false 
        })
      }
    } catch (error: any) {
      console.error('检查认证状态失败:', error)
      // 出错时清除所有数据
      await TokenManager.clearTokens()
      await UserStorage.clear()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },
}))

// 导出常用的选择器
export const authSelectors = {
  user: (state: AuthState) => state.user,
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  isLoading: (state: AuthState) => state.isLoading,
  error: (state: AuthState) => state.error,
}