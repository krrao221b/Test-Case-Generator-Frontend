// API endpoints and configuration constants

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Test case generation
  GENERATE_TEST_CASES: '/api/generate',
  
  // Jira integration
  JIRA_TICKET: '/api/jira/ticket',
  JIRA_PROJECTS: '/api/jira/projects',
  
  // Zephyr integration
  ZEPHYR_PUSH: '/api/zephyr/push',
  ZEPHYR_PROJECTS: '/api/zephyr/projects',
  
  // Test case management
  TEST_CASES: '/api/testcases',
  TEST_CASE_BY_ID: (id: string) => `/api/testcases/${id}`,
  SIMILAR_TEST_CASES: '/api/testcases/similar',
} as const;

export const PRIORITIES = [
  { value: 'Low', label: 'Low', color: '#4caf50' },
  { value: 'Medium', label: 'Medium', color: '#ff9800' },
  { value: 'High', label: 'High', color: '#f44336' },
  { value: 'Critical', label: 'Critical', color: '#9c27b0' },
] as const;

export const TEST_CASE_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  PUSHED: 'pushed',
} as const;

export const FORM_VALIDATION = {
  JIRA_TICKET_ID: {
    pattern: /^[A-Z]+-\d+$/,
    message: 'Invalid Jira ticket ID format (expected: ABC-123)',
  },
  URL: {
    pattern: /^https?:\/\/.+/,
    message: 'Invalid URL format',
  },
  REQUIRED_FIELD: 'This field is required',
  MIN_LENGTH: (min: number) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max: number) => `Maximum ${max} characters allowed`,
} as const;

export const UI_CONSTANTS = {
  DRAWER_WIDTH: 280,
  APP_BAR_HEIGHT: 64,
  NOTIFICATION_DURATION: 4000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_PAGE_SIZE: 10,
} as const;

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'ai-test-gen-preferences',
  DRAFT_TEST_CASES: 'ai-test-gen-drafts',
  RECENT_JIRA_TICKETS: 'ai-test-gen-recent-tickets',
} as const;
