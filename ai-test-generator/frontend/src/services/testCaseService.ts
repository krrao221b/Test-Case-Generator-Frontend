import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants';
import type { 
  GenerateTestCaseRequest, 
  GenerateTestCaseResponse,
  TestCase,
  ApiResponse 
} from '../types';

/**
 * Service for AI-powered test case generation
 */
export class TestCaseService {
  /**
   * Generate test cases using AI based on input type
   */
  static async generateTestCases(request: GenerateTestCaseRequest): Promise<GenerateTestCaseResponse> {
    try {
      const response = await apiClient.post<GenerateTestCaseResponse>(
        API_ENDPOINTS.GENERATE_TEST_CASES,
        request
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate test cases');
      }

      // Check if response.data contains the actual GenerateTestCaseResponse
      if (response.data && typeof response.data === 'object' && 'testCases' in response.data) {
        return response.data as GenerateTestCaseResponse;
      }

      // If response.data is wrapped in another success structure, unwrap it
      const dataAsAny = response.data as any;
      if (dataAsAny && dataAsAny.success && dataAsAny.data) {
        return dataAsAny.data as GenerateTestCaseResponse;
      }

      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Error generating test cases:', error);
      throw error;
    }
  }

  /**
   * Get all saved test cases
   */
  static async getAllTestCases(): Promise<TestCase[]> {
    try {
      const response = await apiClient.get<TestCase[]>(API_ENDPOINTS.TEST_CASES);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch test cases');
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching test cases:', error);
      throw error;
    }
  }

  /**
   * Get a specific test case by ID
   */
  static async getTestCaseById(id: string): Promise<TestCase> {
    try {
      const response = await apiClient.get<TestCase>(
        API_ENDPOINTS.TEST_CASE_BY_ID(id)
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch test case');
      }

      return response.data!;
    } catch (error) {
      console.error('Error fetching test case:', error);
      throw error;
    }
  }

  /**
   * Save a test case
   */
  static async saveTestCase(testCase: Partial<TestCase>): Promise<TestCase> {
    try {
      const endpoint = testCase.id 
        ? API_ENDPOINTS.TEST_CASE_BY_ID(testCase.id)
        : API_ENDPOINTS.TEST_CASES;
      
      const method = testCase.id ? 'put' : 'post';
      
      const response = await apiClient[method]<TestCase>(endpoint, testCase);

      if (!response.success) {
        throw new Error(response.error || 'Failed to save test case');
      }

      return response.data!;
    } catch (error) {
      console.error('Error saving test case:', error);
      throw error;
    }
  }

  /**
   * Delete a test case
   */
  static async deleteTestCase(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.TEST_CASE_BY_ID(id));

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete test case');
      }
    } catch (error) {
      console.error('Error deleting test case:', error);
      throw error;
    }
  }

  /**
   * Find similar test cases based on acceptance criteria
   */
  static async findSimilarTestCases(criteria: string): Promise<TestCase[]> {
    try {
      const response = await apiClient.post<TestCase[]>(
        API_ENDPOINTS.SIMILAR_TEST_CASES,
        { criteria }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to find similar test cases');
      }

      return response.data || [];
    } catch (error) {
      console.error('Error finding similar test cases:', error);
      throw error;
    }
  }

  /**
   * Validate test case data
   */
  static validateTestCase(testCase: Partial<TestCase>): string[] {
    const errors: string[] = [];

    if (!testCase.name?.trim()) {
      errors.push('Test case name is required');
    }

    if (!testCase.description?.trim()) {
      errors.push('Test case description is required');
    }

    if (!testCase.steps || testCase.steps.length === 0) {
      errors.push('At least one test step is required');
      } else {
        testCase.steps.forEach((step: any, index: number) => {
          if (!step.action?.trim()) {
            errors.push(`Step ${index + 1}: Action is required`);
          }
          if (!step.expectedResult?.trim()) {
            errors.push(`Step ${index + 1}: Expected result is required`);
          }
        });
      }    if (!testCase.priority) {
      errors.push('Priority is required');
    }

    return errors;
  }

  /**
   * Export test cases to JSON
   */
  static exportToJson(testCases: TestCase[]): string {
    try {
      return JSON.stringify(testCases, null, 2);
    } catch (error) {
      console.error('Error exporting test cases to JSON:', error);
      throw new Error('Failed to export test cases');
    }
  }

  /**
   * Import test cases from JSON
   */
  static importFromJson(jsonString: string): TestCase[] {
    try {
      const testCases = JSON.parse(jsonString);
      
      if (!Array.isArray(testCases)) {
        throw new Error('Invalid format: expected array of test cases');
      }

      // Validate each test case
      testCases.forEach((testCase, index) => {
        const errors = this.validateTestCase(testCase);
        if (errors.length > 0) {
          throw new Error(`Test case ${index + 1}: ${errors.join(', ')}`);
        }
      });

      return testCases;
    } catch (error) {
      console.error('Error importing test cases from JSON:', error);
      throw error;
    }
  }
}
