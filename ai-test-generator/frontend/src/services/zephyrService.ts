import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "../constants";
import type {
  TestCase,
  TestStep,
  ZephyrPushRequest,
  ZephyrPushResponse,
} from "../types";

/**
 * Service for Zephyr Scale integration
 */
export class ZephyrService {
  /**
   * Push a single test case to Zephyr Scale
   */
  static async pushTestCase(
    request: ZephyrPushRequest
  ): Promise<ZephyrPushResponse> {
    try {
      const response = await apiClient.post<ZephyrPushResponse>(
        API_ENDPOINTS.ZEPHYR_PUSH,
        request
      );

      if (!response.success) {
        throw new Error(
          response.error || "Failed to push test case to Zephyr"
        );
      }

      return response.data!;
    } catch (error) {
      console.error("Error pushing test case to Zephyr:", error);
      throw error;
    }
  }

  /**
   * Format test case for Zephyr Scale API
   */
  static formatTestCaseForZephyr(testCase: TestCase, jiraId: string): ZephyrPushRequest {
    return {
      jira_id: jiraId,
      testcase_name: testCase.title,
      objective: testCase.description,
      precondition: testCase.preconditions || "",
      test_steps: testCase.test_steps.map((step: TestStep) => ({
        step: step.action,
        test_data: step.test_data || "",
        expected_result: step.expected_result,
      })),
    };
  }

  /**
   * Validate test case before pushing to Zephyr
   */
  static validateTestCaseForZephyr(testCase: TestCase, jiraId: string): string[] {
    const errors: string[] = [];

    if (!jiraId?.trim()) {
      errors.push("JIRA ID is required");
    }

    if (!testCase.title?.trim()) {
      errors.push("Test case title is required");
    }

    if (!testCase.description?.trim()) {
      errors.push("Test case description is required");
    }

    if (!testCase.test_steps || testCase.test_steps.length === 0) {
      errors.push("At least one test step is required");
    } else {
      testCase.test_steps.forEach((step: TestStep, stepIndex: number) => {
        const stepNumber = stepIndex + 1;

        if (!step.action?.trim()) {
          errors.push(`Step ${stepNumber}: Action is required`);
        }

        if (!step.expected_result?.trim()) {
          errors.push(`Step ${stepNumber}: Expected result is required`);
        }
      });
    }

    return errors;
  }
}
