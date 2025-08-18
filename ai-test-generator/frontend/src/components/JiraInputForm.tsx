import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import type { JiraTicket, SimilarTestCase } from "../types";

interface JiraInputFormProps {
  onSubmit: (ticketIdOrUrl: string) => Promise<void>;
  onGenerate?: () => Promise<void>; // New prop for generate action
  loading: boolean;
  similarLoading?: boolean;
  error: string | null;
  ticket: JiraTicket | null;
  similarCases?: SimilarTestCase[];
}

const JiraInputForm: React.FC<JiraInputFormProps> = ({
  onSubmit,
  onGenerate,
  loading,
  similarLoading = false,
  error,
  ticket,
  similarCases = [],
}) => {
  const [input, setInput] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ticket && onGenerate) {
      // If ticket is already fetched, generate test cases
      await onGenerate();
    } else if (input.trim()) {
      // If no ticket yet, fetch the ticket
      await onSubmit(input.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Clear the ticket when user changes input (forces re-fetch)
    // This will be handled by parent component
  };

  const getButtonText = () => {
    if (loading) {
      return ticket ? "Generating..." : "Fetching Ticket...";
    }
    return ticket ? "Generate Test Cases" : "Fetch Ticket";
  };

  const isButtonDisabled = () => {
    if (loading) return true;
    if (ticket) return false; // Can always generate if ticket exists
    return !input.trim(); // Need input to fetch
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Jira Ticket Input
      </Typography>

      <TextField
        fullWidth
        label="Jira Ticket ID or URL"
        placeholder="e.g., PROJ-123 or https://company.atlassian.net/browse/PROJ-123"
        value={input}
        onChange={handleInputChange}
        error={!!error}
        disabled={loading}
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {ticket && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              {ticket.key}: {ticket.summary}
            </Typography>

            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item>
                <Chip label={`Status: ${ticket.status}`} size="small" />
              </Grid>
              {ticket.priority && (
                <Grid item>
                  <Chip label={`Priority: ${ticket.priority}`} size="small" />
                </Grid>
              )}
              <Grid item>
                <Chip
                  label={`Assignee: ${ticket.assignee || "Unassigned"}`}
                  size="small"
                />
              </Grid>
            </Grid>

            {/* Full Description in Accordion */}
            {ticket.description && (
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight="bold">
                    Description
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {ticket.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Full Acceptance Criteria in Accordion */}
            {ticket.acceptance_criteria && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight="bold">
                    Acceptance Criteria
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {ticket.acceptance_criteria}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Success message */}
            <Alert severity="success" sx={{ mt: 2 }}>
              Ticket fetched successfully! Click "Generate Test Cases" to
              proceed.
            </Alert>

            {/* Similar cases preview (if any) */}
            {similarLoading && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Loading similar cases...
                </Typography>
              </Box>
            )}
            {similarCases.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Similar Test Cases Found
                </Typography>
                <Box component="ul" sx={{ pl: 3, m: 0 }}>
                  {similarCases.slice(0, 5).map((sc, idx) => (
                    <li key={idx}>
                      <Typography variant="body2" color="text.secondary">
                        {sc.test_case.title} (Similarity Score:{" "}
                        {Math.round(sc.similarity_score * 100)}%)
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isButtonDisabled()}
        color={ticket ? "success" : "primary"}
      >
        {getButtonText()}
      </Button>

      {/* Reset button when ticket is loaded */}
      {ticket && !loading && (
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 1 }}
          onClick={() => {
            setInput("");
            // This will trigger parent to clear ticket
          }}
        >
          Fetch Different Ticket
        </Button>
      )}
    </Box>
  );
};

export default JiraInputForm;
