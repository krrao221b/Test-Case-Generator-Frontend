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

export interface ZephyrPushRequest {
  testCases: TestCase[];
  projectKey: string;
  cycleId?: string;
}

export interface ZephyrPushResponse {
  success: boolean;
  pushedTestCases: Array<{
    localId: string;
    zephyrId: string;
    status: "success" | "failed";
    error?: string;
  }>;
  message?: string;
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
