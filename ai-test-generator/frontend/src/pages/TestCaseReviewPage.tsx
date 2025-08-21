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
  Tooltip,
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
  Pagination,
  InputAdornment,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as PushIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Link as LinkIcon,
  HelpOutline as HelpIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useSearchParams, useLocation } from "react-router-dom";

// Components
import TestCasePreview from "../components/TestCasePreview";

// Services
import { TestCaseService, JiraService } from "../services";
import { useZephyr } from "../hooks/useZephyr";

// Types
import type { TestCase, TestStep } from "../types";

const ITEMS_PER_PAGE = 5;

const TestCaseReviewPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    loading: zephyrLoading,
    pushTestCaseWithUI,
    validateTestCase: validateTestCaseForZephyr,
  } = useZephyr();

  // State
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  // Saving state to block actions/exit while awaiting response
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savingAction, setSavingAction] = useState<"edit" | "new" | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<TestCase>>({});
  // const [pushingId, setPushingId] = useState<string | null>(null);
  // Jira key validation state
  const [jiraKeyStatus, setJiraKeyStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [jiraKeyMessage, setJiraKeyMessage] = useState<string>("");

  // Helper function to check if restricted fields (Description, Feature Description, Acceptance Criteria) are modified
  const areRestrictedFieldsModified = () => {
    if (!selectedTestCase) return false;
    
    const descriptionChanged = (editForm.description || '').trim() !== (selectedTestCase.description || '').trim();
    const featureDescChanged = (editForm.feature_description || '').trim() !== (selectedTestCase.feature_description || '').trim();
    const acceptanceCriteriaChanged = (editForm.acceptance_criteria || '').trim() !== (selectedTestCase.acceptance_criteria || '').trim();
    
    return descriptionChanged || featureDescChanged || acceptanceCriteriaChanged;
  };

  // Search params and location
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Highlighted test case state
  const [highlightedTestCaseId, setHighlightedTestCaseId] = useState<
    string | null
  >(null);
  const [shouldScrollToHighlighted, setShouldScrollToHighlighted] =
    useState(false);

  // Consider a test case "recent" if created within the last ~2 minutes (milliseconds)
  const RECENT_WINDOW_MS = 120_000;
  // Robust timestamp parsing: if no timezone suffix, assume UTC
  const parseCreatedAtMs = (createdAt?: string | Date | null): number => {
    if (!createdAt) return NaN;
    if (createdAt instanceof Date) return createdAt.getTime();
    const s = String(createdAt).trim();
    const hasTz = /Z|[+-]\d{2}:\d{2}$/.test(s);
    const d = new Date(hasTz ? s : `${s}Z`);
    return d.getTime();
  };

  const isRecentlyGenerated = (createdAt?: string | Date | null): boolean => {
    const created = parseCreatedAtMs(createdAt);
    if (isNaN(created)) return false;
    return Date.now() - created <= RECENT_WINDOW_MS;
  };

  useEffect(() => {
    fetchTestCases();
  }, []);

  const fetchTestCases = async () => {
    try {
      setLoading(true);
      const cases = await TestCaseService.getAllTestCases();
      setTestCases(cases);
      // reset to page 1 after fresh load (optional)
      setCurrentPage(1);
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
    const normalizedTestSteps =
      testCase.test_steps?.map((step, index) => ({
        step_number: index + 1,
        action: step.action || "",
        expected_result: step.expected_result || "",
        test_data: step.test_data || "",
      })) || [];

    setEditForm({
      ...testCase,
      test_steps: normalizedTestSteps,
    });
    // reset jira validation for fresh edit
    setJiraKeyStatus("idle");
    setJiraKeyMessage("");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTestCase || !editForm.id) return;

    // Validate test steps
    const errors: string[] = [];
    // If Jira key is provided but not validated as 'valid', block save
    if ((editForm.jira_issue_key || "").trim() && jiraKeyStatus !== "valid") {
      enqueueSnackbar("Please validate the Jira Issue Key before saving.", {
        variant: "warning",
      });
      return;
    }

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
        variant: "error",
      });
      return;
    }

    // Normalize fields (e.g., Jira key)
    const normalizedEditForm: Partial<TestCase> = {
      ...editForm,
      jira_issue_key: editForm.jira_issue_key
        ? editForm.jira_issue_key.trim().toUpperCase()
        : editForm.jira_issue_key,
    };

    // Basic Jira key validation if provided
    if (normalizedEditForm.jira_issue_key) {
      const jiraFormat = /^[A-Z][A-Z0-9]+-\d+$/; // e.g., PROJ-123
      if (!jiraFormat.test(normalizedEditForm.jira_issue_key)) {
        enqueueSnackbar("Invalid Jira Issue Key format (expected ABC-123).", {
          variant: "warning",
        });
        return;
      }
    }

    try {
      setIsSaving(true);
      setSavingAction("edit");
      const updatedTestCase = await TestCaseService.saveTestCase(normalizedEditForm);
      setTestCases(
        testCases.map((tc) => (tc.id === editForm.id ? updatedTestCase : tc))
      );
      setEditDialogOpen(false);
      enqueueSnackbar("Test case updated successfully", { variant: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update test case";
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
    } finally {
      setIsSaving(false);
      setSavingAction(null);
    }
  };

  // Save current edits as a brand-new test case (no overwrite)
  const handleSaveAsNew = async () => {
    if (!selectedTestCase?.id) return;
    // Validate minimal requirements
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
      enqueueSnackbar(`Validation errors: ${errors.join(", ")}`, { variant: "error" });
      return;
    }

    try {
      setIsSaving(true);
      setSavingAction("new");
      const newTestCase = await TestCaseService.saveAsNew(
        selectedTestCase.id.toString(),
        editForm
      );
      // Add to top and highlight
      setTestCases([newTestCase, ...testCases]);
      setHighlightedTestCaseId(newTestCase.id?.toString() || null);
      setShouldScrollToHighlighted(true);
      setEditDialogOpen(false);
      enqueueSnackbar("Saved as a new test case", { variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save as new";
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
    } finally {
      setIsSaving(false);
      setSavingAction(null);
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
      const newList = testCases.filter((tc) => tc.id !== selectedTestCase.id);
      setTestCases(newList);

      // adjust current page if necessary (for example if last item on last page was deleted)
      const totalPagesAfterDelete = Math.max(
        1,
        Math.ceil(newList.length / ITEMS_PER_PAGE)
      );
      if (currentPage > totalPagesAfterDelete) {
        setCurrentPage(totalPagesAfterDelete);
      }

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
        if (tag && tag.includes("-")) {
          const parts = tag.split("-");
          if (
            parts.length === 2 &&
            parts[0].match(/^[A-Z]+$/) &&
            parts[1].match(/^\d+$/)
          ) {
            jiraId = tag;
            break;
          }
        }
      }
    }

    const normalizedJiraId = (jiraId || "").trim().toUpperCase();

    if (!normalizedJiraId) {
      enqueueSnackbar(
        "No JIRA issue key found. Please update the test case to be linked to a JIRA ticket.",
        { variant: "warning" }
      );
      return;
    }

    // Validate Jira key format
    const jiraFormat = /^[A-Z][A-Z0-9]+-\d+$/;
    if (!jiraFormat.test(normalizedJiraId)) {
      enqueueSnackbar("Invalid Jira Issue Key format (expected ABC-123).", { variant: "warning" });
      return;
    }

    // Validate test case content for Zephyr using the hook
    const validationErrors = validateTestCaseForZephyr(testCase, normalizedJiraId);
    if (validationErrors.length > 0) {
      enqueueSnackbar(`Cannot push: ${validationErrors.join("; ")}`, { variant: "error" });
      return;
    }

    try {
      // Use the new method with UI duplicate handling
      await pushTestCaseWithUI(testCase, normalizedJiraId);
    } catch (error) {
      // Error handling is done automatically by the hook
      console.error('Push to Zephyr failed:', error);
    }
  };

  // Highlight+params effect (keeps same behaviour)
  useEffect(() => {
    // Check for highlight parameter
    const highlightId = searchParams.get("highlight");
    const shouldFocus = searchParams.get("focus") === "true";
    const source = searchParams.get("source");

    if (highlightId) {
      setHighlightedTestCaseId(highlightId);
      // don't set shouldScrollToHighlighted here — we'll set it after ensuring the page is correct
      if (shouldFocus) {
        setShouldScrollToHighlighted(true);
      }
    }

    // If coming from generator with session data
    if (source === "generator") {
      const pendingTestCases = sessionStorage.getItem("pendingReviewTestCases");
      if (pendingTestCases) {
        try {
          const testCasesFromSession = JSON.parse(pendingTestCases);
          // Merge with existing test cases or handle as needed
          if (testCasesFromSession.length > 0) {
            setHighlightedTestCaseId(testCasesFromSession[0].id);
            setShouldScrollToHighlighted(true);
          }
          // Clear session storage
          sessionStorage.removeItem("pendingReviewTestCases");
        } catch (error) {
          console.error("Failed to parse pending test cases:", error);
        }
      }
    }
  }, [searchParams, location]);

  // If a highlighted test case exists and testCases are loaded,
  // ensure the page shows that test case (so scrollIntoView will find it)
  useEffect(() => {
    if (!highlightedTestCaseId || testCases.length === 0) return;

    const index = testCases.findIndex(
      (tc) => tc.id?.toString() === highlightedTestCaseId
    );
    if (index >= 0) {
      const pageForHighlighted = Math.floor(index / ITEMS_PER_PAGE) + 1;
      if (pageForHighlighted !== currentPage) {
        setCurrentPage(pageForHighlighted);
      }
      // ensure scroll happens after render (shouldScrollToHighlighted may already be true)
      setShouldScrollToHighlighted(true);
    }
  }, [highlightedTestCaseId, testCases]);

  // Scroll-to-highlight effect (unchanged)
  useEffect(() => {
    if (shouldScrollToHighlighted && highlightedTestCaseId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(
          `test-case-${highlightedTestCaseId}`
        );
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
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
      test_data: "",
    };

    setEditForm({
      ...editForm,
      test_steps: [...(editForm.test_steps || []), newStep],
    });
  };

  const removeTestStep = (index: number) => {
    const updatedSteps =
      editForm.test_steps?.filter((_, i) => i !== index) || [];
    // Renumber the remaining steps
    const renumberedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_number: i + 1,
    }));

    setEditForm({
      ...editForm,
      test_steps: renumberedSteps,
    });
  };

  const updateTestStep = (
    index: number,
    field: keyof TestStep,
    value: string
  ) => {
    const updatedSteps = [...(editForm.test_steps || [])];
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value,
    };

    setEditForm({
      ...editForm,
      test_steps: updatedSteps,
    });
  };

  // Derived values for pagination
  const totalPages = Math.max(1, Math.ceil(testCases.length / ITEMS_PER_PAGE));
  // ensure currentPage is within bounds (if testCases length changed)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedTestCases = testCases.slice(startIndex, endIndex);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    // optionally ensure any previous highlight scroll is reset
    setShouldScrollToHighlighted(false);
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
      <Typography variant="h1" gutterBottom sx={{ mt: 6.5 }}>
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
        <>
          <Grid container spacing={3}>
            {displayedTestCases.map((testCase) => (
              <Grid item xs={12} key={testCase.id}>
                <Card
                  id={`test-case-${testCase.id}`} // Add ID for scrolling
                  sx={{
                    // Add highlighting styles
                    ...(highlightedTestCaseId === testCase.id?.toString() && {
                      border: "2px solid",
                      borderColor: "primary.main",
                      boxShadow: (theme) =>
                        `0 0 20px ${theme.palette.primary.main}40`,
                      backgroundColor: (theme) =>
                        `${theme.palette.primary.main}08`,
                    }),
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <CardContent>
                    {/* Show Recently Generated only if created_at is recent */}
                    {isRecentlyGenerated((testCase as any).created_at) && (
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
                          sx={{
                            textAlign: "justify",
                            maxHeight: 100, // limit height
                            maxWidth: 500, // limit width
                            lineHeight: 1.6,
                            minWidth: 0,
                            hyphens: "auto",
                          }}
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

                      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(testCase)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={
                            zephyrLoading ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <PushIcon />
                            )
                          }
                          variant="contained"
                          onClick={() => handlePushToZephyr(testCase)}
                          disabled={zephyrLoading}
                        >
                          {zephyrLoading ? 'Pushing...' : 'Push to Zephyr'}
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

          {/* Pagination controls */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}

      {/* Edit Dialog (unchanged) */}
      <Dialog
        open={editDialogOpen}
        onClose={(reason) => {
          // Block closing via backdrop/escape while saving
          if (isSaving && (reason === "backdropClick" || reason === "escapeKeyDown")) {
            return;
          }
          setEditDialogOpen(false);
        }}
        maxWidth="lg"
        fullWidth
        disableEscapeKeyDown={isSaving}
      >
        <DialogTitle>Edit Test Case</DialogTitle>
        <DialogContent>
          {/* Disable all inputs while saving */}
          <Box component="fieldset" disabled={isSaving} sx={{ border: 0, p: 0, m: 0 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Jira tip and key go first for visibility */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 1 }}>
                Optional: Link a Jira Issue Key (e.g., PROJ-123) to enable pushing this test case to Zephyr.
              </Alert>
            </Grid>

            {/* Prominent Jira Issue Key field */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderLeft: (theme) => `4px solid ${
                    jiraKeyStatus === 'valid'
                      ? theme.palette.success.main
                      : jiraKeyStatus === 'invalid'
                      ? theme.palette.error.main
                      : theme.palette.primary.main
                  }`,
                  // keep background clean per best practices; use field states instead
                  backgroundColor: 'transparent',
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Jira Issue Key (optional)"
                  placeholder="PROJ-123"
                  value={editForm.jira_issue_key || ""}
                  onChange={(e) =>
                    {
                      setEditForm({ ...editForm, jira_issue_key: e.target.value });
                      setJiraKeyStatus('idle');
                      setJiraKeyMessage('');
                    }
                  }
                  error={jiraKeyStatus === 'invalid'}
                  color={jiraKeyStatus === 'valid' ? 'success' : 'primary'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tooltip title={jiraKeyStatus === 'checking' ? 'Checking…' : 'Validate Jira key'}>
                          <span>
                            <IconButton
                              aria-label="validate jira key"
                              size="small"
                              color={jiraKeyStatus === 'invalid' ? 'error' : jiraKeyStatus === 'valid' ? 'success' : 'primary'}
                              disabled={jiraKeyStatus === 'checking' || !(editForm.jira_issue_key || '').trim()}
                              onClick={async () => {
                                const raw = (editForm.jira_issue_key || '').trim().toUpperCase();
                                if (!raw) return;
                                // quick format check
                                const fmt = /^[A-Z][A-Z0-9]+-\d+$/;
                                if (!fmt.test(raw)) {
                                  setJiraKeyStatus('invalid');
                                  setJiraKeyMessage('Invalid format (expected ABC-123).');
                                  return;
                                }
                                setJiraKeyStatus('checking');
                                setJiraKeyMessage('');
                                try {
                                  // call backend without similar cases
                                  await JiraService.getTicket(raw, { includeSimilar: false });
                                  setJiraKeyStatus('valid');
                                  setJiraKeyMessage('Ticket exists');
                                } catch (err: any) {
                                  const status = err?.status ?? err?.originalError?.status;
                                  if (status === 404) {
                                    setJiraKeyStatus('invalid');
                                    setJiraKeyMessage('Ticket not found');
                                  } else {
                                    setJiraKeyStatus('invalid');
                                    setJiraKeyMessage(err?.message || 'Failed to verify');
                                  }
                                }
                              }}
                            >
                              {jiraKeyStatus === 'valid' ? (
                                <CheckCircleIcon fontSize="small" />
                              ) : jiraKeyStatus === 'invalid' ? (
                                <ErrorOutlineIcon fontSize="small" />
                              ) : (
                                <LinkIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Format: ABC-123. Not required, but needed for Zephyr push.">
                          <HelpIcon fontSize="small" />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  helperText={
                    jiraKeyStatus === 'invalid'
                      ? (jiraKeyMessage || 'Invalid Jira issue key.')
                      : jiraKeyStatus === 'valid'
                        ? 'Looks good. This ticket exists.'
                        : 'Format: ABC-123 (e.g., SCRUM-42).'
                  }
                />
              </Box>
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                autoFocus
                required
                label="Title"
                value={editForm.title || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                helperText={!editForm.title?.trim() ? "Title is required" : " "}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Description"
                value={editForm.description || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="High-level description of this test case"
                helperText={
                  areRestrictedFieldsModified() && 
                  (editForm.description || '').trim() !== (selectedTestCase?.description || '').trim()
                    ? "⚠️ Editing this field requires 'Save as New' - cannot update existing test case"
                    : ""
                }
                error={
                  areRestrictedFieldsModified() && 
                  (editForm.description || '').trim() !== (selectedTestCase?.description || '').trim()
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Feature Description"
                value={editForm.feature_description || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    feature_description: e.target.value,
                  })
                }
                placeholder="What part of the product this test covers"
                helperText={
                  areRestrictedFieldsModified() && 
                  (editForm.feature_description || '').trim() !== (selectedTestCase?.feature_description || '').trim()
                    ? "⚠️ Editing this field requires 'Save as New' - cannot update existing test case"
                    : ""
                }
                error={
                  areRestrictedFieldsModified() && 
                  (editForm.feature_description || '').trim() !== (selectedTestCase?.feature_description || '').trim()
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Acceptance Criteria"
                value={editForm.acceptance_criteria || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    acceptance_criteria: e.target.value,
                  })
                }
                placeholder="List the criteria that must be met for pass"
                helperText={
                  areRestrictedFieldsModified() && 
                  (editForm.acceptance_criteria || '').trim() !== (selectedTestCase?.acceptance_criteria || '').trim()
                    ? "⚠️ Editing this field requires 'Save as New' - cannot update existing test case"
                    : ""
                }
                error={
                  areRestrictedFieldsModified() && 
                  (editForm.acceptance_criteria || '').trim() !== (selectedTestCase?.acceptance_criteria || '').trim()
                }
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  size="small"
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
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  size="small"
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
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6">Test Steps</Typography>
                <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={addTestStep}>
                  Add Step
                </Button>
              </Stack>
              <Divider />
            </Grid>

            {/* Test Steps List */}
            {editForm.test_steps?.map((step, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
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
                        onChange={(e) =>
                          updateTestStep(index, "action", e.target.value)
                        }
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
                        onChange={(e) =>
                          updateTestStep(index, "test_data", e.target.value)
                        }
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Expected Result"
                        placeholder="What should happen after this action..."
                        value={step.expected_result || ""}
                        onChange={(e) =>
                          updateTestStep(
                            index,
                            "expected_result",
                            e.target.value
                          )
                        }
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
                size="small"
                multiline
                rows={2}
                label="Overall Expected Result"
                value={editForm.expected_result || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, expected_result: e.target.value })
                }
                placeholder="What should be true at the end of this test"
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Tags (comma-separated)"
                value={editForm.tags?.join(", ") || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag),
                  })
                }
                placeholder="authentication, login, security"
                helperText="Use commas to separate tags"
              />
            </Grid>
          </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button
            onClick={handleSaveAsNew}
            variant="outlined"
            disabled={
              isSaving ||
              !editForm.title?.trim() ||
              !editForm.test_steps?.length
            }
            startIcon={isSaving && savingAction === "new" ? <CircularProgress size={18} /> : undefined}
          >
            {isSaving && savingAction === "new" ? "Saving…" : "Save as New"}
          </Button>
          <Tooltip 
            title={
              areRestrictedFieldsModified() 
                ? "Cannot save changes to Description, Feature Description, or Acceptance Criteria. Use 'Save as New' instead."
                : ""
            }
          >
            <span>
              <Button
                onClick={handleSaveEdit}
                variant="contained"
                disabled={
                  isSaving ||
                  !editForm.title?.trim() ||
                  !editForm.test_steps?.length ||
                  (((editForm.jira_issue_key || '').trim().length > 0) && jiraKeyStatus !== 'valid') ||
                  areRestrictedFieldsModified()
                }
                startIcon={isSaving && savingAction === "edit" ? <CircularProgress size={18} color="inherit" /> : undefined}
              >
                {isSaving && savingAction === "edit" ? "Saving…" : "Save Changes"}
              </Button>
            </span>
          </Tooltip>
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
