import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants';
import type { TestCase, ZephyrPushRequest, ZephyrPushResponse } from '../types';

/**
 * Service for Zephyr Scale integration
 */
export class ZephyrService {
  /**
   * Push test cases to Zephyr Scale
   */
  static async pushTestCases(request: ZephyrPushRequest): Promise<ZephyrPushResponse> {
    try {
      const response = await apiClient.post<ZephyrPushResponse>(
        API_ENDPOINTS.ZEPHYR_PUSH,
        request
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to push test cases to Zephyr');
      }

      return response.data!;
    } catch (error) {
      console.error('Error pushing test cases to Zephyr:', error);
      throw error;
    }
  }

  /**
   * Get available Zephyr projects
   */
  static async getProjects(): Promise<Array<{ id: string; key: string; name: string }>> {
    try {
      const response = await apiClient.get<Array<{ id: string; key: string; name: string }>>(
        API_ENDPOINTS.ZEPHYR_PROJECTS
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Zephyr projects');
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching Zephyr projects:', error);
      throw error;
    }
  }

  /**
   * Format test case for Zephyr Scale API
   */
  static formatTestCaseForZephyr(testCase: TestCase): any {
    return {
      name: testCase.name,
      description: testCase.description,
      precondition: testCase.preconditions || '',
      priority: testCase.priority,
      estimatedTime: testCase.estimatedTime || 0,
      labels: testCase.labels || [],
      testSteps: testCase.steps.map((step: any, index: number) => ({
        index: index + 1,
        description: step.action,
        testData: step.testData || '',
        expectedResult: step.expectedResult,
      })),
    };
  }

  /**
   * Validate test cases before pushing to Zephyr
   */
  static validateTestCasesForZephyr(testCases: TestCase[]): string[] {
    const errors: string[] = [];

    if (!testCases || testCases.length === 0) {
      errors.push('No test cases to push');
      return errors;
    }

    testCases.forEach((testCase, index) => {
      const testCaseNumber = index + 1;

      if (!testCase.name?.trim()) {
        errors.push(`Test case ${testCaseNumber}: Name is required`);
      }

      if (!testCase.description?.trim()) {
        errors.push(`Test case ${testCaseNumber}: Description is required`);
      }

      if (!testCase.steps || testCase.steps.length === 0) {
        errors.push(`Test case ${testCaseNumber}: At least one test step is required`);
      } else {
        testCase.steps.forEach((step: any, stepIndex: number) => {
          const stepNumber = stepIndex + 1;
          
          if (!step.action?.trim()) {
            errors.push(`Test case ${testCaseNumber}, Step ${stepNumber}: Action is required`);
          }
          
          if (!step.expectedResult?.trim()) {
            errors.push(`Test case ${testCaseNumber}, Step ${stepNumber}: Expected result is required`);
          }
        });
      }

      if (!testCase.priority) {
        errors.push(`Test case ${testCaseNumber}: Priority is required`);
      }
    });

    return errors;
  }

  /**
   * Estimate push time based on number of test cases
   */
  static estimatePushTime(testCaseCount: number): string {
    const baseTime = 2; // seconds per test case
    const totalSeconds = testCaseCount * baseTime;
    
    if (totalSeconds < 60) {
      return `${totalSeconds} seconds`;
    } else {
      const minutes = Math.ceil(totalSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }

  /**
   * Create push summary for user confirmation
   */
  static createPushSummary(testCases: TestCase[], projectKey: string): {
    totalTestCases: number;
    estimatedTime: string;
    projectKey: string;
    testCaseNames: string[];
  } {
    return {
      totalTestCases: testCases.length,
      estimatedTime: this.estimatePushTime(testCases.length),
      projectKey,
      testCaseNames: testCases.map(tc => tc.name),
    };
  }
}
