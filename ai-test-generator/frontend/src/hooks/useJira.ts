import { useState, useCallback } from 'react';
import { JiraService } from '../services';
import type { JiraTicket } from '../types';

interface UseJiraReturn {
  ticket: JiraTicket | null;
  loading: boolean;
  error: string | null;
  fetchTicket: (ticketIdOrUrl: string) => Promise<void>;
  clearTicket: () => void;
  parseTicketUrl: (url: string) => string | null;
  validateTicketId: (ticketId: string) => boolean;
}

/**
 * Custom hook for Jira integration
 */
export const useJira = (): UseJiraReturn => {
  const [ticket, setTicket] = useState<JiraTicket | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async (ticketIdOrUrl: string): Promise<void> => {
    if (!ticketIdOrUrl.trim()) {
      setError('Ticket ID or URL is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Try to parse as URL first, then use as ticket ID
      let ticketId = JiraService.parseTicketUrl(ticketIdOrUrl);
      if (!ticketId) {
        ticketId = ticketIdOrUrl.trim().toUpperCase();
      }

      // Validate ticket ID format
      if (!JiraService.validateTicketId(ticketId)) {
        throw new Error('Invalid Jira ticket ID format (expected: ABC-123)');
      }

      const fetchedTicket = await JiraService.getTicket(ticketId);
      setTicket(fetchedTicket);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Jira ticket';
      setError(errorMessage);
      console.error('Error fetching Jira ticket:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTicket = useCallback(() => {
    setTicket(null);
    setError(null);
  }, []);

  const parseTicketUrl = useCallback((url: string): string | null => {
    return JiraService.parseTicketUrl(url);
  }, []);

  const validateTicketId = useCallback((ticketId: string): boolean => {
    return JiraService.validateTicketId(ticketId);
  }, []);

  return {
    ticket,
    loading,
    error,
    fetchTicket,
    clearTicket,
    parseTicketUrl,
    validateTicketId,
  };
};
