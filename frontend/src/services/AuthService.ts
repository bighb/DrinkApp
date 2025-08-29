import { ApiService } from './ApiService';
import { 
  LoginCredentials, 
  RegisterCredentials, 
  UpdateProfileData, 
  ApiResponse, 
  User 
} from '@/types';

export class AuthService {
  private static readonly BASE_URL = '/auth';

  /**
   * User login
   */
  static async login(credentials: LoginCredentials): Promise<ApiResponse<{
    user: User;
    token: string;
    refreshToken: string;
  }>> {
    try {
      const response = await ApiService.post(`${this.BASE_URL}/login`, credentials);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * User registration
   */
  static async register(credentials: RegisterCredentials): Promise<ApiResponse<{
    user: User;
    token: string;
    refreshToken: string;
  }>> {
    try {
      const response = await ApiService.post(`${this.BASE_URL}/register`, credentials);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(refreshToken: string): Promise<ApiResponse<{
    token: string;
    refreshToken: string;
  }>> {
    try {
      const response = await ApiService.post(`${this.BASE_URL}/refresh`, {
        refresh_token: refreshToken,
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  /**
   * User logout
   */
  static async logout(token: string): Promise<ApiResponse<void>> {
    try {
      const response = await ApiService.post(`${this.BASE_URL}/logout`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: UpdateProfileData, token: string): Promise<ApiResponse<User>> {
    try {
      const response = await ApiService.put('/users/profile', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed');
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(token: string): Promise<ApiResponse<User>> {
    try {
      const response = await ApiService.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch profile');
    }
  }

  /**
   * Email verification
   */
  static async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await ApiService.post(`${this.BASE_URL}/verify-email`, {
        token,
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Email verification failed');
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await ApiService.post(`${this.BASE_URL}/forgot-password`, {
        email,
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Password reset request failed');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await ApiService.post(`${this.BASE_URL}/reset-password`, {
        token,
        password,
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  }

  /**
   * Change password
   */
  static async changePassword(
    currentPassword: string,
    newPassword: string,
    token: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await ApiService.post('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Password change failed');
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await ApiService.delete('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Account deletion failed');
    }
  }

  /**
   * Upload avatar
   */
  static async uploadAvatar(imageUri: string, token: string): Promise<ApiResponse<{ avatar_url: string }>> {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await ApiService.post('/users/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Avatar upload failed');
    }
  }
}