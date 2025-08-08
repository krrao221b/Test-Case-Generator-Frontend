import { useState, useCallback } from 'react';
import { ZephyrService } from '../services';
import type { TestCase, ZephyrPushRequest, ZephyrPushResponse } from '../types';

interface UseZephyrReturn {
  loading: boolean;
  error: string | null;
  pushResult: ZephyrPushResponse | null;
  pushTestCases: (testCases: TestCase[], projectKey: string, cycleId?: string) => Promise<void>;
  validateTestCases: (testCases: TestCase[]) => string[];
  clearPushResult: () => void;
}

/**
 * Custom hook for Zephyr Scale integration
 */
export const useZephyr = (): UseZephyrReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<ZephyrPushResponse | null>(null);

  const pushTestCases = useCallback(async (
    testCases: TestCase[], 
    projectKey: string, 
    cycleId?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    setPushResult(null);
    
    try {
      // Validate test cases before pushing
      const validationErrors = ZephyrService.validateTestCasesForZephyr(testCases);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const request: ZephyrPushRequest = {
        testCases,
        projectKey,
        cycleId,
      };

      const result = await ZephyrService.pushTestCases(request);
      setPushResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to push test cases to Zephyr';
      setError(errorMessage);
      console.error('Error pushing test cases to Zephyr:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateTestCases = useCallback((testCases: TestCase[]): string[] => {
    return ZephyrService.validateTestCasesForZephyr(testCases);
  }, []);

  const clearPushResult = useCallback(() => {
    setPushResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    pushResult,
    pushTestCases,
    validateTestCases,
    clearPushResult,
  };
};
