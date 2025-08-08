import React, { useState } from 'react';
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
} from '@mui/material';
import type { JiraTicket } from '../types';

interface JiraInputFormProps {
  onSubmit: (ticketIdOrUrl: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  ticket: JiraTicket | null;
}

const JiraInputForm: React.FC<JiraInputFormProps> = ({
  onSubmit,
  loading,
  error,
  ticket,
}) => {
  const [input, setInput] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await onSubmit(input.trim());
    }
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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
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
            <Typography variant="body2" color="text.secondary" paragraph>
              {ticket.description.substring(0, 200)}...
            </Typography>
            <Grid container spacing={1}>
              <Grid item>
                <Chip label={`Status: ${ticket.status}`} size="small" />
              </Grid>
              <Grid item>
                <Chip label={`Assignee: ${ticket.assignee || 'Unassigned'}`} size="small" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading || !input.trim()}
      >
        {loading ? 'Fetching Ticket...' : 'Fetch & Generate'}
      </Button>
    </Box>
  );
};

export default JiraInputForm;
