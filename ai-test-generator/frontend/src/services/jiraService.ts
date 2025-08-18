import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "../constants";
import type { JiraTicket, JiraTicketWithSimilar, SimilarTestCase } from "../types";

/**
 * Service for Jira integration
 */
export class JiraService {
  /**
   * Fetch Jira ticket by ID or key
   */
  static async getTicket(
    ticketIdOrKey: string,
    options?: { includeSimilar?: boolean; limit?: number; threshold?: number }
  ): Promise<JiraTicketWithSimilar> {
    try {
      const params = new URLSearchParams();
      const includeSimilar = options?.includeSimilar ?? true;
      const limit = options?.limit ?? 5;
      const threshold = options?.threshold ?? 0.7;
      params.set("include_similar", String(includeSimilar));
      params.set("limit", String(limit));
      params.set("threshold", String(threshold));

      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.JIRA_TICKET}/${ticketIdOrKey}?${params.toString()}`
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch Jira ticket");
      }

      // Backend now returns { jira_ticket_data, similar_cases }
      const payload = response.data;
      const backendData = payload?.jira_ticket_data || payload;
      const backendSimilar = (payload?.similar_cases || []) as Array<{
        test_case: any;
        similarity_score: number;
      }>;
      const jiraTicket: JiraTicket = {
        id: backendData.key, // Use key as id since backend doesn't return separate id
        key: backendData.key,
        summary: backendData.summary,
        description: backendData.description,
        acceptance_criteria: backendData.acceptance_criteria || "",
        status: backendData.status,
        priority: backendData.priority,
        assignee: backendData.assignee,
        reporter: backendData.reporter,
        created: backendData.created,
        updated: backendData.updated,
        attachments: backendData.attachments || [],
      };

      const similar: SimilarTestCase[] = backendSimilar.map((sc) => ({
        test_case: sc.test_case as any,
        similarity_score: sc.similarity_score,
      }));

      return { ticket: jiraTicket, similar_cases: similar };
    } catch (error) {
      console.error("Error fetching Jira ticket:", error);
      throw error;
    }
  }

  /**
   * Get available Jira projects
   */
  static async getProjects(): Promise<
    Array<{ id: string; key: string; name: string }>
  > {
    try {
      const response = await apiClient.get<
        Array<{ id: string; key: string; name: string }>
      >(API_ENDPOINTS.JIRA_PROJECTS);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch Jira projects");
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching Jira projects:", error);
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
        /\/browse\/([A-Z]+-\d+)/, // Standard browse URL
        /\/([A-Z]+-\d+)$/, // Direct ticket URL
        /ticketId=([A-Z]+-\d+)/, // Query parameter
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error("Error parsing Jira URL:", error);
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
        /(?:acceptance criteria|ac):\s*(.*?)(?:\n\n|\n(?=[A-Z])|$)/gim,
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
      console.error("Error extracting acceptance criteria:", error);
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
      summary:
        ticket.description.substring(0, 200) +
        (ticket.description.length > 200 ? "..." : ""),
      details: [
        { label: "Status", value: ticket.status },
        { label: "Priority", value: ticket.priority || "Unknown" },
        { label: "Assignee", value: ticket.assignee || "Unassigned" },
        { label: "Reporter", value: ticket.reporter || "Unknown" },
        {
          label: "Created",
          value: ticket.created
            ? new Date(ticket.created).toLocaleDateString()
            : "Unknown",
        },
        {
          label: "Updated",
          value: ticket.updated
            ? new Date(ticket.updated).toLocaleDateString()
            : "Unknown",
        },
      ],
    };
  }
}
