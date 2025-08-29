import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, ERROR_CODES, ERROR_MESSAGES } from '@/constants/config';
import { ApiResponse } from '@/types';
import { StorageService } from './StorageService';
import { STORAGE_KEYS } from '@/constants/config';
import NetInfo from '@react-native-community/netinfo';

// Custom error class
class ApiError extends Error {
  code: string;
  status?: number;
  data?: any;

  constructor(message: string, code: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          throw new ApiError(
            ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
            ERROR_CODES.NETWORK_ERROR
          );
        }

        // Add auth token if available
        const token = await StorageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add device info
        config.headers['X-Device-Platform'] = 'react-native';
        config.headers['X-App-Version'] = '1.0.0'; // TODO: Get from app config

        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await StorageService.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const newToken = response.data.token;
              const newRefreshToken = response.data.refreshToken;

              // Store new tokens
              await StorageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
              await StorageService.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

              // Retry all queued requests
              this.processQueue(null, newToken);

              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            
            // Clear invalid tokens
            await StorageService.removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
            await StorageService.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
            
            // Redirect to login would be handled by the auth slice
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token!);
      }
    });

    this.failedQueue = [];
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleError(error: any): ApiError {
    if (error.code === 'ECONNABORTED') {
      return new ApiError(
        ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
        ERROR_CODES.NETWORK_ERROR,
        0,
        { timeout: true }
      );
    }

    if (!error.response) {
      return new ApiError(
        ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
        ERROR_CODES.NETWORK_ERROR,
        0,
        { networkError: true }
      );
    }

    const { status, data } = error.response;

    // Map HTTP status codes to error codes
    let errorCode = ERROR_CODES.UNKNOWN_ERROR;
    if (status >= 400 && status < 500) {
      errorCode = status === 401 ? ERROR_CODES.AUTH_ERROR : ERROR_CODES.VALIDATION_ERROR;
    } else if (status >= 500) {
      errorCode = ERROR_CODES.SERVER_ERROR;
    }

    const message = data?.message || data?.error || ERROR_MESSAGES[errorCode];

    return new ApiError(message, errorCode, status, data);
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get(url, config);
      return this.formatResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.patch(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete(url, config);
      return this.formatResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // File upload method
  async uploadFile<T = any>(url: string, file: any, progressCallback?: (progress: number) => void): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressCallback && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            progressCallback(Math.round(progress));
          }
        },
      };

      const response = await this.api.post(url, formData, config);
      return this.formatResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Batch requests with retry logic
  async batchRequest<T = any>(requests: Array<() => Promise<any>>, maxConcurrent = 3): Promise<T[]> {
    const results: T[] = [];
    const errors: any[] = [];

    // Process requests in batches
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (request, index) => {
        try {
          const result = await this.retryRequest(request, API_CONFIG.RETRY_ATTEMPTS);
          return { success: true, data: result, index: i + index };
        } catch (error) {
          return { success: false, error, index: i + index };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results[result.value.index] = result.value.data;
          } else {
            errors[result.value.index] = result.value.error;
          }
        }
      });
    }

    if (errors.length > 0) {
      throw new ApiError(
        `Batch request failed with ${errors.length} errors`,
        ERROR_CODES.SERVER_ERROR,
        0,
        { errors }
      );
    }

    return results;
  }

  // Retry logic
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number,
    delay: number = API_CONFIG.RETRY_DELAY
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;

        // Don't retry certain errors
        if (error.code === ERROR_CODES.AUTH_ERROR || 
            error.code === ERROR_CODES.VALIDATION_ERROR ||
            error.status === 400 || error.status === 401 || error.status === 403) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError;
  }

  // Token refresh
  private async refreshToken(refreshToken: string): Promise<any> {
    // Remove auth header for refresh request
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: API_CONFIG.TIMEOUT,
      }
    );

    return this.formatResponse(response);
  }

  // Response formatter
  private formatResponse<T>(response: AxiosResponse): ApiResponse<T> {
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data.data || response.data,
      message: response.data.message,
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Cancel all pending requests
  cancelAllRequests() {
    // Axios doesn't have a built-in way to cancel all requests
    // This would require implementing with AbortController
    console.warn('Cancel all requests not implemented');
  }

  // Get request statistics
  getStats() {
    return {
      baseURL: this.api.defaults.baseURL,
      timeout: this.api.defaults.timeout,
      isRefreshing: this.isRefreshing,
      queuedRequests: this.failedQueue.length,
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;