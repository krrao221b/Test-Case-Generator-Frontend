import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Search as SearchIcon, Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

// Components
import TestCasePreview from "../components/TestCasePreview";

// Services
import { TestCaseService } from "../services";

// Types
import type { TestCase } from "../types";

const TestCaseLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch test cases on component mount
  useEffect(() => {
    fetchTestCases();
  }, []);

  // Filter test cases when search term or filters change
  useEffect(() => {
    filterTestCases();
  }, [testCases, searchTerm, priorityFilter, statusFilter]);

  const fetchTestCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const cases = await TestCaseService.getAllTestCases();
      setTestCases(cases);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load test cases";
      setError(message);
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filterTestCases = () => {
    let filtered = testCases;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (testCase) =>
          testCase.title.toLowerCase().includes(term) ||
          testCase.description.toLowerCase().includes(term) ||
          testCase.feature_description.toLowerCase().includes(term)
      );
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (testCase) => testCase.priority === priorityFilter
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (testCase) => testCase.status === statusFilter
      );
    }

    setFilteredTestCases(filtered);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading test cases...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h1" gutterBottom>
          Test Case Library
        </Typography>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchTestCases}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h1">Test Case Library</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/generate")}
        >
          Generate New Test Case
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search test cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="deprecated">Deprecated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {testCases.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Test Cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {testCases.filter((tc) => tc.status === "active").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="warning.main">
                {testCases.filter((tc) => tc.status === "draft").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Draft
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="error.main">
                {testCases.filter((tc) => tc.priority === "critical").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Results */}
      {filteredTestCases.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {testCases.length === 0
                ? "No test cases found"
                : "No test cases match your filters"}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {testCases.length === 0
                ? "Start by generating your first test case."
                : "Try adjusting your search criteria or filters."}
            </Typography>
            {testCases.length === 0 && (
              <Button
                variant="contained"
                onClick={() => navigate("/generate")}
                sx={{ mt: 2 }}
              >
                Generate Your First Test Case
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">
              {filteredTestCases.length} test case
              {filteredTestCases.length !== 1 ? "s" : ""} found
            </Typography>
          </Box>
          <TestCasePreview testCases={filteredTestCases} />
        </>
      )}
    </Box>
  );
};

export default TestCaseLibraryPage;
