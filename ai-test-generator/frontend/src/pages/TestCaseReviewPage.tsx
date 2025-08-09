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
} from "@mui/icons-material";
import { useSnackbar } from "notistack";

// Components
import TestCasePreview from "../components/TestCasePreview";

// Services
import { TestCaseService, ZephyrService } from "../services";

// Types
import type { TestCase } from "../types";

const TestCaseReviewPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [pushDialogOpen, setPushDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<TestCase>>({});

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
    setEditForm({ ...testCase });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTestCase || !editForm.id) return;

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

  const handlePushToZephyr = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setPushDialogOpen(true);
  };

  const confirmPushToZephyr = async () => {
    if (!selectedTestCase?.id) return;

    try {
      // Note: This is a simplified implementation
      // In reality, you'd need project selection and other Zephyr configuration
      await ZephyrService.pushTestCases({
        projectKey: "DEFAULT", // This should come from user selection
        testCases: [selectedTestCase],
      } as any);

      setPushDialogOpen(false);
      enqueueSnackbar("Test case pushed to Zephyr Scale successfully", {
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to push to Zephyr Scale";
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
    }
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
              <Card>
                <CardContent>
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

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Test Case</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
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

      {/* Push to Zephyr Dialog */}
      <Dialog open={pushDialogOpen} onClose={() => setPushDialogOpen(false)}>
        <DialogTitle>Push to Zephyr Scale</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Push "{selectedTestCase?.title}" to Zephyr Scale?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            This will create a new test case in your Zephyr Scale project.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPushDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmPushToZephyr} variant="contained">
            Push to Zephyr
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestCaseReviewPage;
