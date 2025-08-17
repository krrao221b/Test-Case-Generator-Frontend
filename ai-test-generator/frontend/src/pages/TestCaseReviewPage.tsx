import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as PushIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useSearchParams, useLocation } from "react-router-dom";

// Components
import TestCasePreview from "../components/TestCasePreview";

// Services
import { TestCaseService, ZephyrService } from "../services";

// Types
import type { TestCase, TestStep } from "../types";

const TestCaseReviewPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<TestCase>>({});

  // Search params and location
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Highlighted test case state
  const [highlightedTestCaseId, setHighlightedTestCaseId] = useState<string | null>(null);
  const [shouldScrollToHighlighted, setShouldScrollToHighlighted] = useState(false);

  useEffect(() => {
    fetchTestCases();
  }, []);

  const fetchTestCases = async () => {
    try {
      setLoading(true);
      const cases = await TestCaseService.getAllTestCases();
      setTestCases(cases);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load test cases";
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    
    // Ensure test steps have proper structure
    const normalizedTestSteps = testCase.test_steps?.map((step, index) => ({
      step_number: index + 1,
      action: step.action || "",
      expected_result: step.expected_result || "",
      test_data: step.test_data || ""
    })) || [];

    setEditForm({ 
      ...testCase,
      test_steps: normalizedTestSteps
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTestCase || !editForm.id) return;

    // Validate test steps
    const errors: string[] = [];
    
    if (!editForm.title?.trim()) {
      errors.push("Title is required");
    }
    
    if (!editForm.test_steps || editForm.test_steps.length === 0) {
      errors.push("At least one test step is required");
    } else {
      editForm.test_steps.forEach((step, index) => {
        if (!step.action?.trim()) {
          errors.push(`Step ${index + 1}: Action is required`);
        }
        if (!step.expected_result?.trim()) {
          errors.push(`Step ${index + 1}: Expected result is required`);
        }
      });
    }

    if (errors.length > 0) {
      enqueueSnackbar(`Validation errors: ${errors.join(", ")}`, { 
        variant: "error" 
      });
      return;
    }

    try {
      const updatedTestCase = await TestCaseService.saveTestCase(editForm);
      setTestCases(
        testCases.map((tc) => (tc.id === editForm.id ? updatedTestCase : tc))
      );
      setEditDialogOpen(false);
      enqueueSnackbar("Test case updated successfully", { variant: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update test case";
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
    }
  };

  const handleDelete = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTestCase?.id) return;

    try {
      await TestCaseService.deleteTestCase(selectedTestCase.id.toString());
      setTestCases(testCases.filter((tc) => tc.id !== selectedTestCase.id));
      setDeleteDialogOpen(false);
      enqueueSnackbar("Test case deleted successfully", { variant: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete test case";
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
    }
  };

  const handlePushToZephyr = async (testCase: TestCase) => {
    // Check if test case has a JIRA issue key
    let jiraId = testCase.jira_issue_key;
    
    // If no JIRA issue key, try to extract from tags
    if (!jiraId && testCase.tags && testCase.tags.length > 0) {
      // Look for JIRA/SCRUM pattern in tags (e.g., "SCRUM-22", "PROJ-123")
      for (const tag of testCase.tags) {
        if (tag && tag.includes('-')) {
          const parts = tag.split('-');
          if (parts.length === 2 && parts[0].match(/^[A-Z]+$/) && parts[1].match(/^\d+$/)) {
            jiraId = tag;
            break;
          }
        }
      }
    }
    
    if (!jiraId) {
      enqueueSnackbar(
        "No JIRA issue key found. Please ensure the test case is linked to a JIRA ticket.", 
        { variant: "warning" }
      );
      return;
    }
    
    try {
      // Format the request according to backend API
      const request = ZephyrService.formatTestCaseForZephyr(testCase, jiraId);
      
      // Push to Zephyr
      const response = await ZephyrService.pushTestCase(request);
      
      enqueueSnackbar(
        `Test case pushed to Zephyr successfully! Test case key: ${response.testcase_key} (linked to ${jiraId})`, 
        { variant: "success" }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to push to Zephyr Scale";
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
    }
  };

  // Highlight and scroll effect
  useEffect(() => {
    // Check for highlight parameter
    const highlightId = searchParams.get('highlight');
    const shouldFocus = searchParams.get('focus') === 'true';
    const source = searchParams.get('source');
    
    if (highlightId) {
      setHighlightedTestCaseId(highlightId);
      setShouldScrollToHighlighted(shouldFocus);
    }
    
    // If coming from generator with session data
    if (source === 'generator') {
      const pendingTestCases = sessionStorage.getItem('pendingReviewTestCases');
      if (pendingTestCases) {
        try {
          const testCases = JSON.parse(pendingTestCases);
          // Merge with existing test cases or handle as needed
          if (testCases.length > 0) {
            setHighlightedTestCaseId(testCases[0].id);
            setShouldScrollToHighlighted(true);
          }
          // Clear session storage
          sessionStorage.removeItem('pendingReviewTestCases');
        } catch (error) {
          console.error('Failed to parse pending test cases:', error);
        }
      }
    }
  }, [searchParams, location]);

  // Add scroll effect
  useEffect(() => {
    if (shouldScrollToHighlighted && highlightedTestCaseId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`test-case-${highlightedTestCaseId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
        setShouldScrollToHighlighted(false);
      }, 500); // Small delay to ensure render

      return () => clearTimeout(timer);
    }
  }, [shouldScrollToHighlighted, highlightedTestCaseId, testCases]);

  // Add helper functions for test step management
  const addTestStep = () => {
    const newStep = {
      step_number: (editForm.test_steps?.length || 0) + 1,
      action: "",
      expected_result: "",
      test_data: ""
    };
    
    setEditForm({
      ...editForm,
      test_steps: [...(editForm.test_steps || []), newStep]
    });
  };

  const removeTestStep = (index: number) => {
    const updatedSteps = editForm.test_steps?.filter((_, i) => i !== index) || [];
    // Renumber the remaining steps
    const renumberedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_number: i + 1
    }));
    
    setEditForm({
      ...editForm,
      test_steps: renumberedSteps
    });
  };

  const updateTestStep = (index: number, field: keyof TestStep, value: string) => {
    const updatedSteps = [...(editForm.test_steps || [])];
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value
    };
    
    setEditForm({
      ...editForm,
      test_steps: updatedSteps
    });
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

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Review & Edit Test Cases
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Review, edit, and manage your test cases before pushing them to Zephyr
        Scale.
      </Typography>

      {testCases.length === 0 ? (
        <Alert severity="info">
          No test cases found. Generate some test cases first to review them
          here.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {testCases.map((testCase) => (
            <Grid item xs={12} key={testCase.id}>
              <Card
                id={`test-case-${testCase.id}`} // Add ID for scrolling
                sx={{
                  // Add highlighting styles
                  ...(highlightedTestCaseId === testCase.id?.toString() && {
                    border: '2px solid',
                    borderColor: 'primary.main',
                    boxShadow: (theme) => `0 0 20px ${theme.palette.primary.main}40`,
                    backgroundColor: (theme) => `${theme.palette.primary.main}08`,
                  }),
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                <CardContent>
                  {/* Add a highlighted badge if this is the highlighted test case */}
                  {highlightedTestCaseId === testCase.id?.toString() && (
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label="Recently Generated" 
                        color="primary" 
                        size="small"
                        icon={<EditIcon />}
                      />
                    </Box>
                  )}
                  
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {testCase.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                      >
                        {testCase.description}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                        <Chip
                          label={testCase.priority}
                          size="small"
                          color={
                            testCase.priority === "critical"
                              ? "error"
                              : testCase.priority === "high"
                              ? "warning"
                              : testCase.priority === "medium"
                              ? "info"
                              : "default"
                          }
                        />
                        <Chip
                          label={testCase.status || "draft"}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(testCase)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={<PushIcon />}
                        variant="contained"
                        onClick={() => handlePushToZephyr(testCase)}
                      >
                        Push to Zephyr
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleDelete(testCase)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>

                  <TestCasePreview testCases={[testCase]} variant="compact" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Enhanced Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="lg" // Changed from "md" to "lg" for more space
        fullWidth
      >
        <DialogTitle>Edit Test Case</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editForm.title || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={editForm.description || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Feature Description"
                value={editForm.feature_description || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, feature_description: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Acceptance Criteria"
                value={editForm.acceptance_criteria || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, acceptance_criteria: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editForm.priority || "medium"}
                  label="Priority"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      priority: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status || "draft"}
                  label="Status"
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value as any })
                  }
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="deprecated">Deprecated</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Test Steps Section */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Test Steps</Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={addTestStep}
                >
                  Add Step
                </Button>
              </Box>
            </Grid>

            {/* Test Steps List */}
            {editForm.test_steps?.map((step, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" color="primary">
                      Step {step.step_number}
                    </Typography>
                    <Button
                      startIcon={<RemoveIcon />}
                      size="small"
                      color="error"
                      onClick={() => removeTestStep(index)}
                      disabled={editForm.test_steps?.length === 1}
                    >
                      Remove
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Action"
                        placeholder="Describe what the user should do..."
                        value={step.action || ""}
                        onChange={(e) => updateTestStep(index, "action", e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Test Data (Optional)"
                        placeholder="Any specific data needed for this step..."
                        value={step.test_data || ""}
                        onChange={(e) => updateTestStep(index, "test_data", e.target.value)}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Expected Result"
                        placeholder="What should happen after this action..."
                        value={step.expected_result || ""}
                        onChange={(e) => updateTestStep(index, "expected_result", e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}

            {/* Overall Expected Result */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Overall Expected Result"
                value={editForm.expected_result || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, expected_result: e.target.value })
                }
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={editForm.tags?.join(", ") || ""}
                onChange={(e) =>
                  setEditForm({ 
                    ...editForm, 
                    tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag) 
                  })
                }
                placeholder="authentication, login, security"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={!editForm.title?.trim() || !editForm.test_steps?.length}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Test Case</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTestCase?.title}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default TestCaseReviewPage;
