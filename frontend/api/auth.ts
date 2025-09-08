import { ApiClient } from './client'
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  AuthTokens,
  ApiResponse 
} from './types'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

// 认证API服务
export class AuthApi {
  // 用户注册
  static async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    try {
      const response = await ApiClient.post<RegisterResponse>('/auth/register', data)
      return response
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  // 用户登录
  static async login(data: Omit<LoginRequest, 'deviceInfo'>): Promise<ApiResponse<LoginResponse>> {
    try {
      // 收集设备信息
      const deviceInfo = {
        id: Constants.sessionId || 'unknown',
        name: Device.deviceName || 'Unknown Device',
        type: Device.deviceType?.toString() || 'unknown',
        platform: Device.osName || 'unknown',
      }

      const loginData: LoginRequest = {
        ...data,
        deviceInfo,
      }

      const response = await ApiClient.post<LoginResponse>('/auth/login', loginData)
      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 刷新令牌
  static async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    try {
      const response = await ApiClient.post<AuthTokens>('/auth/refresh', {
        refreshToken,
      })
      return response
    } catch (error) {
      console.error('刷新令牌失败:', error)
      throw error
    }
  }

  // 用户登出
  static async logout(): Promise<ApiResponse> {
    try {
      const response = await ApiClient.post('/auth/logout')
      return response
    } catch (error) {
      console.error('登出失败:', error)
      throw error
    }
  }

  // 从所有设备登出
  static async logoutAll(): Promise<ApiResponse> {
    try {
      const response = await ApiClient.post('/auth/logout-all')
      return response
    } catch (error) {
      console.error('全部登出失败:', error)
      throw error
    }
  }

  // 发送邮箱验证
  static async sendVerificationEmail(): Promise<ApiResponse> {
    try {
      const response = await ApiClient.post('/auth/verify-email')
      return response
    } catch (error) {
      console.error('发送验证邮件失败:', error)
      throw error
    }
  }

  // 验证邮箱
  static async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      const response = await ApiClient.post('/auth/verify-email/confirm', {
        token,
      })
      return response
    } catch (error) {
      console.error('邮箱验证失败:', error)
      throw error
    }
  }

  // 发送密码重置邮件
  static async sendPasswordResetEmail(email: string): Promise<ApiResponse> {
    try {
      const response = await ApiClient.post('/auth/forgot-password', {
        email,
      })
      return response
    } catch (error) {
      console.error('发送密码重置邮件失败:', error)
      throw error
    }
  }

  // 重置密码
  static async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await ApiClient.post('/auth/reset-password', {
        token,
        newPassword,
      })
      return response
    } catch (error) {
      console.error('重置密码失败:', error)
      throw error
    }
  }

  // 获取当前会话列表
  static async getSessions(): Promise<ApiResponse> {
    try {
      const response = await ApiClient.get('/auth/sessions')
      return response
    } catch (error) {
      console.error('获取会话列表失败:', error)
      throw error
    }
  }

  // 撤销指定会话
  static async revokeSession(sessionToken: string): Promise<ApiResponse> {
    try {
      const response = await ApiClient.delete(`/auth/sessions/${sessionToken}`)
      return response
    } catch (error) {
      console.error('撤销会话失败:', error)
      throw error
    }
  }
}

export default AuthApi