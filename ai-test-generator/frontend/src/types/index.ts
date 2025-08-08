// Type definitions for the AI Test Generator application

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  acceptanceCriteria: string[];
  status: string;
  assignee?: string;
  reporter?: string;
  created: string;
  updated: string;
}

export interface TestStep {
  id?: string;
  stepNumber: number;
  action: string;
  testData: string;
  expectedResult: string;
}

export interface TestCase {
  id?: string;
  name: string;
  description: string;
  preconditions?: string;
  steps: TestStep[];
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedTime?: number;
  labels?: string[];
  jiraTicketId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateTestCaseRequest {
  type: 'manual' | 'jira';
  jiraTicketId?: string;
  jiraUrl?: string;
  manualInput?: {
    acceptanceCriteria: string;
    featureRequirements: string;
    description: string;
  };
}

export interface GenerateTestCaseResponse {
  success: boolean;
  testCases: TestCase[];
  similarTestCases?: TestCase[];
  message?: string;
  error?: string;
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
    status: 'success' | 'failed';
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
  defaultPriority: TestCase['priority'];
  maxSimilarTestCases: number;
}
