import { useState, useCallback } from 'react';
import { ZephyrService } from '../services';
import type { TestCase, ZephyrPushRequest, ZephyrPushResponse } from '../types';

interface UseZephyrReturn {
  loading: boolean;
  error: string | null;
  pushResult: ZephyrPushResponse | null;
  pushTestCase: (testCase: TestCase, jiraId: string) => Promise<void>;
  validateTestCase: (testCase: TestCase, jiraId: string) => string[];
  clearPushResult: () => void;
}

/**
 * Custom hook for Zephyr Scale integration
 */
export const useZephyr = (): UseZephyrReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<ZephyrPushResponse | null>(null);

  const pushTestCase = useCallback(async (
    testCase: TestCase, 
    jiraId: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    setPushResult(null);
    
    try {
      // Validate test case before pushing
      const validationErrors = ZephyrService.validateTestCaseForZephyr(testCase, jiraId);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const request: ZephyrPushRequest = ZephyrService.formatTestCaseForZephyr(testCase, jiraId);

      const result = await ZephyrService.pushTestCase(request);
      setPushResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to push test case to Zephyr';
      setError(errorMessage);
      console.error('Error pushing test case to Zephyr:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateTestCase = useCallback((testCase: TestCase, jiraId: string): string[] => {
    return ZephyrService.validateTestCaseForZephyr(testCase, jiraId);
  }, []);

  const clearPushResult = useCallback(() => {
    setPushResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    pushResult,
    pushTestCase,
    validateTestCase,
    clearPushResult,
  };
};
