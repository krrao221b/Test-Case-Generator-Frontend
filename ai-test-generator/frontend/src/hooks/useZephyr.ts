import { useState, useCallback } from 'react';
import { ZephyrService } from '../services';
import type { TestCase, ZephyrPushRequest, ZephyrPushResponse, DuplicateTestCaseError, ZephyrError } from '../types';
import { useSnackbar } from 'notistack';
import DuplicateTestCaseModal from '../components/DuplicateTestCaseModal';
import React from 'react';
import { createRoot } from 'react-dom/client';

interface UseZephyrReturn {
  loading: boolean;
  error: string | null;
  pushResult: ZephyrPushResponse | null;
  pushTestCase: (testCase: TestCase, jiraId: string) => Promise<void>;
  pushTestCaseWithUI: (testCase: TestCase, jiraId: string) => Promise<void>;
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
  const { enqueueSnackbar } = useSnackbar();

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

  const pushTestCaseWithUI = useCallback(async (
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
      
      // Success toast
      enqueueSnackbar(
        `Test case pushed successfully! Key: ${result.testcase_key}`,
        { variant: 'success' }
      );
      
    } catch (err: any) {
      console.error('Error pushing test case to Zephyr:', err);
      
      // Check if it's a 409 conflict error (duplicate)
      if (err?.originalError?.response?.status === 409) {
        const errorData = err.originalError.response.data;
        
        // Show duplicate modal
        showDuplicateModal(errorData, testCase, jiraId);
      } else {
        // Handle other errors normally
        const errorMessage = err instanceof Error ? err.message : 'Failed to push test case to Zephyr';
        setError(errorMessage);
        enqueueSnackbar(`Error: ${errorMessage}`, { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Function to show duplicate modal
  const showDuplicateModal = useCallback((errorData: any, originalTestCase: TestCase, jiraId: string) => {
    // Create modal container
    const modalContainer = document.createElement('div');
    document.body.appendChild(modalContainer);
    const root = createRoot(modalContainer);

    const duplicateError: DuplicateTestCaseError = {
      error: errorData?.error || 'Duplicate test case',
      message: errorData?.message || 'A test case with this name already exists',
      type: 'DUPLICATE_TEST_CASE',
      user_action: 'EDIT_NAME',
      original_name: originalTestCase.title,
      jira_id: jiraId, // This will now show the linked Jira issue
      suggested_names: errorData?.suggested_names || [
        `${originalTestCase.title} - V2`,
        `${originalTestCase.title} - Updated`,
        `${originalTestCase.title} - ${new Date().getFullYear()}`,
      ],
      instructions: errorData?.instructions || 'Please choose a different name for your test case.',
    };

    const handleRetry = async (newName: string) => {
      const updatedTestCase = {
        ...originalTestCase,
        title: newName,
      };
      
      // Retry with new name
      await pushTestCaseWithUI(updatedTestCase, jiraId);
    };

    const handleClose = () => {
      root.unmount();
      document.body.removeChild(modalContainer);
    };

    root.render(
      React.createElement(DuplicateTestCaseModal, {
        isOpen: true,
        onClose: handleClose,
        errorData: duplicateError,
        onRetry: handleRetry,
      })
    );
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
    pushTestCaseWithUI,
    validateTestCase,
    clearPushResult,
  };
};
