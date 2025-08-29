import { ApiService } from './ApiService';
import {
  HydrationRecord,
  CreateRecordData,
  DailyProgress,
  UserStatistics,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

export class HydrationService {
  private static readonly BASE_URL = '/hydration';

  /**
   * Create a new hydration record
   */
  static async createRecord(
    data: CreateRecordData,
    token: string
  ): Promise<ApiResponse<HydrationRecord>> {
    try {
      const response = await ApiService.post(`${this.BASE_URL}/records`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create record');
    }
  }

  /**
   * Get hydration records
   */
  static async getRecords(
    token: string,
    options: {
      page?: number;
      limit?: number;
      start_date?: string;
      end_date?: string;
      drink_type?: string;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<HydrationRecord>>> {
    try {
      const queryParams = new URLSearchParams();

      if (options.page) queryParams.append('page', options.page.toString());
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.start_date)
        queryParams.append('start_date', options.start_date);
      if (options.end_date) queryParams.append('end_date', options.end_date);
      if (options.drink_type)
        queryParams.append('drink_type', options.drink_type);

      const url = `${this.BASE_URL}/records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await ApiService.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch records');
    }
  }

  /**
   * Get a specific hydration record
   */
  static async getRecord(
    recordId: number,
    token: string
  ): Promise<ApiResponse<HydrationRecord>> {
    try {
      const response = await ApiService.get(
        `${this.BASE_URL}/records/${recordId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch record');
    }
  }

  /**
   * Update a hydration record
   */
  static async updateRecord(
    recordId: number,
    data: Partial<CreateRecordData>,
    token: string
  ): Promise<ApiResponse<HydrationRecord>> {
    try {
      const response = await ApiService.put(
        `${this.BASE_URL}/records/${recordId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update record');
    }
  }

  /**
   * Delete a hydration record
   */
  static async deleteRecord(
    recordId: number,
    token: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await ApiService.delete(
        `${this.BASE_URL}/records/${recordId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete record');
    }
  }

  /**
   * Create multiple records (batch)
   */
  static async createRecords(
    records: CreateRecordData[],
    token: string
  ): Promise<ApiResponse<HydrationRecord[]>> {
    try {
      const response = await ApiService.post(
        `${this.BASE_URL}/records/batch`,
        {
          records,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create records');
    }
  }

  /**
   * Get today's progress
   */
  static async getTodayProgress(
    token: string
  ): Promise<ApiResponse<DailyProgress>> {
    try {
      const response = await ApiService.get(`${this.BASE_URL}/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch today's progress");
    }
  }

  /**
   * Get daily progress for a specific date
   */
  static async getDayProgress(
    date: string,
    token: string
  ): Promise<ApiResponse<DailyProgress>> {
    try {
      const response = await ApiService.get(`${this.BASE_URL}/day/${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch day progress');
    }
  }

  /**
   * Get weekly progress
   */
  static async getWeeklyProgress(
    startDate: string,
    endDate: string,
    token: string
  ): Promise<ApiResponse<DailyProgress[]>> {
    try {
      const response = await ApiService.get(
        `${this.BASE_URL}/weekly?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch weekly progress');
    }
  }

  /**
   * Get monthly progress
   */
  static async getMonthlyProgress(
    year: number,
    month: number,
    token: string
  ): Promise<ApiResponse<DailyProgress[]>> {
    try {
      const response = await ApiService.get(
        `${this.BASE_URL}/monthly?year=${year}&month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch monthly progress');
    }
  }

  /**
   * Get user statistics
   */
  static async getStatistics(
    token: string,
    options: {
      period?: 'daily' | 'weekly' | 'monthly';
      start_date?: string;
      end_date?: string;
    } = {}
  ): Promise<ApiResponse<UserStatistics[]>> {
    try {
      const queryParams = new URLSearchParams();

      if (options.period) queryParams.append('period', options.period);
      if (options.start_date)
        queryParams.append('start_date', options.start_date);
      if (options.end_date) queryParams.append('end_date', options.end_date);

      const url = `/users/statistics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await ApiService.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch statistics');
    }
  }

  /**
   * Export records to CSV/JSON
   */
  static async exportRecords(
    format: 'csv' | 'json',
    startDate?: string,
    endDate?: string,
    token?: string
  ): Promise<ApiResponse<{ download_url: string }>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);

      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);

      const response = await ApiService.get(
        `${this.BASE_URL}/export?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to export records');
    }
  }

  /**
   * Import records from file
   */
  static async importRecords(
    fileUri: string,
    format: 'csv' | 'json',
    token: string
  ): Promise<ApiResponse<{ imported_count: number; failed_count: number }>> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: format === 'csv' ? 'text/csv' : 'application/json',
        name: `import.${format}`,
      } as any);
      formData.append('format', format);

      const response = await ApiService.post(
        `${this.BASE_URL}/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to import records');
    }
  }

  /**
   * Get drink type suggestions
   */
  static async getDrinkTypeSuggestions(
    query: string,
    token: string
  ): Promise<ApiResponse<string[]>> {
    try {
      const response = await ApiService.get(
        `${this.BASE_URL}/drink-types/suggestions?q=${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch suggestions');
    }
  }

  /**
   * Get common amounts used by user
   */
  static async getCommonAmounts(token: string): Promise<ApiResponse<number[]>> {
    try {
      const response = await ApiService.get(`${this.BASE_URL}/amounts/common`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch common amounts');
    }
  }
}
