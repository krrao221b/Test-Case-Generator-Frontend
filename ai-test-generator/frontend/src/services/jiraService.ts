import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants';
import type { JiraTicket, ApiResponse } from '../types';

/**
 * Service for Jira integration
 */
export class JiraService {
  /**
   * Fetch Jira ticket by ID or key
   */
  static async getTicket(ticketIdOrKey: string): Promise<JiraTicket> {
    try {
      const response = await apiClient.get<JiraTicket>(
        `${API_ENDPOINTS.JIRA_TICKET}/${ticketIdOrKey}`
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Jira ticket');
      }

      return response.data!;
    } catch (error) {
      console.error('Error fetching Jira ticket:', error);
      throw error;
    }
  }

  /**
   * Get available Jira projects
   */
  static async getProjects(): Promise<Array<{ id: string; key: string; name: string }>> {
    try {
      const response = await apiClient.get<Array<{ id: string; key: string; name: string }>>(
        API_ENDPOINTS.JIRA_PROJECTS
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Jira projects');
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching Jira projects:', error);
      throw error;
    }
  }

  /**
   * Parse Jira ticket URL to extract ticket ID
   */
  static parseTicketUrl(url: string): string | null {
    try {
      // Match common Jira URL patterns
      const patterns = [
        /\/browse\/([A-Z]+-\d+)/,  // Standard browse URL
        /\/([A-Z]+-\d+)$/,         // Direct ticket URL
        /ticketId=([A-Z]+-\d+)/,   // Query parameter
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing Jira URL:', error);
      return null;
    }
  }

  /**
   * Validate Jira ticket ID format
   */
  static validateTicketId(ticketId: string): boolean {
    const pattern = /^[A-Z]+-\d+$/;
    return pattern.test(ticketId.trim().toUpperCase());
  }

  /**
   * Extract acceptance criteria from Jira ticket description
   */
  static extractAcceptanceCriteria(description: string): string[] {
    try {
      const criteria: string[] = [];
      
      // Common patterns for acceptance criteria
      const patterns = [
        /(?:acceptance criteria|ac):\s*(.*?)(?:\n\n|\n(?=[A-Z])|$)/gmi,
        /(?:given|when|then|and)\s+(.+?)(?:\n|$)/gim,
        /^\s*[-*]\s+(.+?)(?:\n|$)/gim,
        /^\s*\d+\.\s+(.+?)(?:\n|$)/gim,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(description)) !== null) {
          const criterion = match[1]?.trim();
          if (criterion && criterion.length > 10) {
            criteria.push(criterion);
          }
        }
      }

      // Remove duplicates and return
      return [...new Set(criteria)];
    } catch (error) {
      console.error('Error extracting acceptance criteria:', error);
      return [];
    }
  }

  /**
   * Format Jira ticket data for display
   */
  static formatTicketForDisplay(ticket: JiraTicket): {
    title: string;
    summary: string;
    details: Array<{ label: string; value: string }>;
  } {
    return {
      title: `${ticket.key}: ${ticket.summary}`,
      summary: ticket.description.substring(0, 200) + (ticket.description.length > 200 ? '...' : ''),
      details: [
        { label: 'Status', value: ticket.status },
        { label: 'Assignee', value: ticket.assignee || 'Unassigned' },
        { label: 'Reporter', value: ticket.reporter || 'Unknown' },
        { label: 'Created', value: new Date(ticket.created).toLocaleDateString() },
        { label: 'Updated', value: new Date(ticket.updated).toLocaleDateString() },
      ],
    };
  }
}
