import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { ApiResponse } from './types'

// API配置
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1' 
  : 'https://your-production-api.com/api/v1'

const API_TIMEOUT = 10000 // 10秒超时

// 存储键名
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const

// 令牌管理工具
export const TokenManager = {
  // 保存令牌
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    } catch (error) {
      console.error('保存令牌失败:', error)
      throw error
    }
  },

  // 获取访问令牌
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN)
    } catch (error) {
      console.error('获取访问令牌失败:', error)
      return null
    }
  },

  // 获取刷新令牌
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN)
    } catch (error) {
      console.error('获取刷新令牌失败:', error)
      return null
    }
  },

  // 清除所有令牌
  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN)
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN)
    } catch (error) {
      console.error('清除令牌失败:', error)
    }
  },

  // 检查令牌是否存在
  async hasTokens(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken()
      const refreshToken = await this.getRefreshToken()
      return !!(accessToken && refreshToken)
    } catch (error) {
      console.error('检查令牌失败:', error)
      return false
    }
  },
}

// 创建axios实例
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器 - 添加认证头
  client.interceptors.request.use(
    async (config) => {
      const accessToken = await TokenManager.getAccessToken()
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
      
      // 添加请求日志（仅开发环境）
      if (__DEV__) {
        console.log('🔵 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        })
      }
      
      return config
    },
    (error) => {
      console.error('请求拦截器错误:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器 - 处理令牌刷新和错误
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // 添加响应日志（仅开发环境）
      if (__DEV__) {
        console.log('🟢 API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        })
      }
      
      return response
    },
    async (error) => {
      const originalRequest = error.config

      // 处理401错误 - 令牌过期
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = await TokenManager.getRefreshToken()
          if (!refreshToken) {
            throw new Error('没有刷新令牌')
          }

          // 刷新令牌
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          await TokenManager.saveTokens(accessToken, newRefreshToken)

          // 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return client(originalRequest)
        } catch (refreshError) {
          console.error('令牌刷新失败:', refreshError)
          // 清除所有令牌，用户需要重新登录
          await TokenManager.clearTokens()
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA)
          
          // 这里可以触发全局登出事件
          // EventEmitter.emit('auth:logout')
          
          return Promise.reject(refreshError)
        }
      }

      // 添加错误日志
      if (__DEV__) {
        console.error('🔴 API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        })
      }

      return Promise.reject(error)
    }
  )

  return client
}

// 创建API客户端实例
export const apiClient = createApiClient()

// 通用API调用封装
export class ApiClient {
  // GET请求
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.get<ApiResponse<T>>(url, config)
    return response.data
  }

  // POST请求
  static async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  // PUT请求
  static async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  // DELETE请求
  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  // PATCH请求
  static async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }
}

// 错误处理工具
export const ApiErrorHandler = {
  // 获取错误信息
  getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
    return '网络请求失败，请检查网络连接'
  },

  // 检查是否为网络错误
  isNetworkError(error: any): boolean {
    return !error.response && error.code === 'NETWORK_ERROR'
  },

  // 检查是否为超时错误
  isTimeoutError(error: any): boolean {
    return error.code === 'ECONNABORTED' || error.message?.includes('timeout')
  },

  // 检查是否为认证错误
  isAuthError(error: any): boolean {
    return error.response?.status === 401
  },

  // 检查是否为权限错误
  isPermissionError(error: any): boolean {
    return error.response?.status === 403
  },
}

export default ApiClient