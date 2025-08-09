import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../constants';
import type { ApiResponse } from '../types';

/**
 * Enhanced Axios client with interceptors for error handling and authentication
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (import.meta.env.DEV) {
          console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
      },
      (error) => {
        // Enhanced error handling
        const errorMessage = this.handleError(error);
        console.error('Response error:', errorMessage);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Enhanced error handling with specific error types
   */
  private handleError(error: any): string {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          return 'Authentication required';
        
        case 403:
          return 'Access denied';
        
        case 404:
          return 'Resource not found';
        
        case 422:
          return data.message || 'Validation error';
        
        case 429:
          return 'Too many requests. Please try again later';
        
        case 500:
          return 'Internal server error';
        
        default:
          return data.message || `Server error (${status})`;
      }
    } else if (error.request) {
      // Network error
      return 'Network error. Please check your connection';
    } else {
      // Other error
      return error.message || 'An unexpected error occurred';
    }
  }

  /**
   * Generic GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url, config);
      // Check if response is already in ApiResponse format or raw data
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data as ApiResponse<T>;
      }
      // Wrap raw data in ApiResponse format
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      };
    } catch (error) {
      throw this.createApiError(error);
    }
  }

  /**
   * Generic POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data, config);
      // Check if response is already in ApiResponse format or raw data
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data as ApiResponse<T>;
      }
      // Wrap raw data in ApiResponse format
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      };
    } catch (error) {
      throw this.createApiError(error);
    }
  }

  /**
   * Generic PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data, config);
      // Check if response is already in ApiResponse format or raw data
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data as ApiResponse<T>;
      }
      // Wrap raw data in ApiResponse format
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      };
    } catch (error) {
      throw this.createApiError(error);
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, config);
      // Check if response is already in ApiResponse format or raw data
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data as ApiResponse<T>;
      }
      // Wrap raw data in ApiResponse format
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      };
    } catch (error) {
      throw this.createApiError(error);
    }
  }

  /**
   * Create standardized API error
   */
  private createApiError(error: any): Error {
    const message = this.handleError(error);
    const apiError = new Error(message);
    (apiError as any).originalError = error;
    (apiError as any).status = error.response?.status;
    return apiError;
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.client.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      // Check if response is already in ApiResponse format or raw data
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data as ApiResponse<T>;
      }
      // Wrap raw data in ApiResponse format
      return {
        success: true,
        data: response.data,
        message: 'Upload successful'
      };
    } catch (error) {
      throw this.createApiError(error);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
