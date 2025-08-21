// Type definitions for the AI Test Generator application

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  acceptance_criteria: string; // Changed from array to string to match backend
  status: string;
  priority?: string;
  assignee?: string;
  reporter?: string;
  created?: string;
  updated?: string;
  attachments?: Array<{ filename: string; url: string }>;
}

export interface TestStep {
  step_number: number;
  action: string;
  expected_result: string;
  test_data?: string;
}

export interface TestCase {
  id?: number;
  title: string;
  description: string;
  feature_description: string;
  acceptance_criteria: string;
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  preconditions?: string;
  test_steps: TestStep[];
  expected_result: string;
  status?: "draft" | "active" | "deprecated";
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  jira_issue_key?: string;
  zephyr_test_id?: string;
}

export interface GenerateTestCaseRequest {
  feature_description: string;
  acceptance_criteria: string;
  additional_context?: string;
  priority?: "low" | "medium" | "high" | "critical";
  tags?: string[];
}

export interface SimilarTestCase {
  test_case: TestCase;
  similarity_score: number;
}

export interface GenerateTestCaseResponse {
  test_case: TestCase;
  similar_cases: SimilarTestCase[];
  generation_metadata: { [key: string]: any };
}

// Jira fetch response that includes similar cases from backend
export interface JiraTicketWithSimilar {
  ticket: JiraTicket;
  similar_cases: SimilarTestCase[];
}

export interface ZephyrPushRequest {
  jira_id: string;
  testcase_name?: string;
  objective?: string;
  precondition?: string;
  test_steps: Array<{
    step: string;
    test_data: string;
    expected_result: string;
  }>;
}

export interface ZephyrPushResponse {
  message: string;
  testcase_key: string;
  testcase_id: number;
  linked_to_issue: boolean;
  steps_pushed: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface User {
  id: string;
  email: string;
  name: string;
  jiraCredentials?: {
    baseUrl: string;
    username: string;
    apiToken: string;
  };
  zephyrCredentials?: {
    baseUrl: string;
    accessKey: string;
    secretKey: string;
  };
}

export interface AppSettings {
  darkMode: boolean;
  autoSave: boolean;
  defaultPriority: TestCase["priority"];
  maxSimilarTestCases: number;
}

// Add duplicate test case error interface
export interface DuplicateTestCaseError {
  error: string;
  message: string;
  type: "DUPLICATE_TEST_CASE";
  user_action: "EDIT_NAME";
  original_name: string;
  jira_id: string;
  suggested_names: string[];
  instructions: string;
}

// Add this type for error handling
export interface ZephyrError extends Error {
  isDuplicate?: boolean;
  duplicateData?: DuplicateTestCaseError;
}
