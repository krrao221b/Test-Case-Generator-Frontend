import { useState, useEffect, useCallback } from 'react';
import { TestCaseService } from '../services';
import type { TestCase } from '../types';

interface UseTestCasesReturn {
  testCases: TestCase[];
  loading: boolean;
  error: string | null;
  refreshTestCases: () => Promise<void>;
  saveTestCase: (testCase: Partial<TestCase>) => Promise<TestCase>;
  deleteTestCase: (id: string) => Promise<void>;
  findSimilarTestCases: (criteria: string) => Promise<TestCase[]>;
}

/**
 * Custom hook for managing test cases state and operations
 */
export const useTestCases = (): UseTestCasesReturn => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTestCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cases = await TestCaseService.getAllTestCases();
      setTestCases(cases);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch test cases';
      setError(errorMessage);
      console.error('Error fetching test cases:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTestCase = useCallback(async (testCase: Partial<TestCase>): Promise<TestCase> => {
    setError(null);
    
    try {
      const savedTestCase = await TestCaseService.saveTestCase(testCase);
      
      // Update local state
      setTestCases(prevCases => {
        if (testCase.id) {
          // Update existing test case
          return prevCases.map(tc => tc.id === testCase.id ? savedTestCase : tc);
        } else {
          // Add new test case
          return [...prevCases, savedTestCase];
        }
      });
      
      return savedTestCase;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save test case';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteTestCase = useCallback(async (id: string): Promise<void> => {
    setError(null);
    
    try {
      await TestCaseService.deleteTestCase(id);
      
      // Update local state
      setTestCases(prevCases => prevCases.filter(tc => tc.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete test case';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const findSimilarTestCases = useCallback(async (criteria: string): Promise<TestCase[]> => {
    setError(null);
    
    try {
      return await TestCaseService.findSimilarTestCases(criteria);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find similar test cases';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Load test cases on mount
  useEffect(() => {
    refreshTestCases();
  }, [refreshTestCases]);

  return {
    testCases,
    loading,
    error,
    refreshTestCases,
    saveTestCase,
    deleteTestCase,
    findSimilarTestCases,
  };
};
