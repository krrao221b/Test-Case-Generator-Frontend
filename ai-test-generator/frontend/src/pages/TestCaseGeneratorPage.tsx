import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  Typography as MuiTypography,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

// Components (will be created)
import JiraInputForm from "../components/JiraInputForm";
import ManualInputForm from "../components/ManualInputForm";
import TestCasePreview from "../components/TestCasePreview";

// Hooks
import { useJira } from "../hooks";

// Services
import { TestCaseService } from "../services";

// Types
import type { GenerateTestCaseRequest, TestCase } from "../types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Test case generator page with Jira and manual input options
 */
const TestCaseGeneratorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([]);
  const [similarTestCases, setSimilarTestCases] = useState<TestCase[]>([]);
  // Duplicate dialog state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateTestCase, setDuplicateTestCase] = useState<TestCase | null>(
    null
  );
  const [pendingRequest, setPendingRequest] =
    useState<GenerateTestCaseRequest | null>(null);

  // Hooks
  const {
    ticket,
    similarCases,
  loading: jiraLoading,
  similarLoading,
    error: jiraError,
    fetchTicket,
  } = useJira();

  // Set initial tab based on URL params
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "jira") {
      setActiveTab(0);
    } else if (type === "manual") {
      setActiveTab(1);
    }
  }, [searchParams]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGenerate = async (request: GenerateTestCaseRequest) => {
  // Keep a copy of the request so the Duplicate dialog's "Generate New"
  // can re-use it (works for both Jira and Manual flows)
  setPendingRequest(request);
    setGenerating(true);

    try {
      const response = await TestCaseService.generateTestCases(request);

      // Duplicate detection
      if (response.generation_metadata?.duplicate_detection) {
        setDuplicateTestCase(response.test_case);
        setDuplicateDialogOpen(true);
        setGenerating(false);
        return;
      }

      // The response contains a single test_case and similar_cases
      setGeneratedTestCases([response.test_case]);
      setSimilarTestCases(
        response.similar_cases.map((sc) => sc.test_case) || []
      );

      enqueueSnackbar(
        `Successfully generated test case: ${response.test_case.title}`,
        { variant: "success" }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleJiraSubmit = async (ticketIdOrUrl: string) => {
    try {
      // Only fetch the ticket, don't generate yet
      await fetchTicket(ticketIdOrUrl);

      enqueueSnackbar("Ticket fetched successfully!", {
        variant: "success",
      });
    } catch (error) {
      console.error("Jira fetch error:", error);
      // Error handling is done in the useJira hook
    }
  };

  // Add new function for generation after fetch
  const handleJiraGenerate = async () => {
    if (!ticket) return;

    try {
      const request: GenerateTestCaseRequest = {
        feature_description: ticket.summary,
        acceptance_criteria: ticket.acceptance_criteria,
        additional_context: ticket.description,
        priority: "medium",
        tags: [ticket.key],
      };

      // For Jira flow, call the dedicated generate-new endpoint directly
      setGenerating(true);
      const resp = await TestCaseService.generateNewTestCase(request);
      setGeneratedTestCases([resp.test_case]);
      // For generate-new, prefer Jira-fetched similar cases if available
      if (similarCases && similarCases.length > 0) {
        setSimilarTestCases(similarCases.map(sc => sc.test_case));
      } else {
        // Some backends may not return similar_cases for generate-new; default to []
        setSimilarTestCases((resp as any).similar_cases ? (resp as any).similar_cases.map((sc: any) => sc.test_case) : []);
      }

      enqueueSnackbar(
        `Generated new test case from ${ticket.key}: ${resp.test_case.title}`,
        { variant: "success" }
      );
    } catch (error) {
      console.error("Generation error:", error);
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      enqueueSnackbar(`Error: ${message}`, { variant: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleManualSubmit = async (data: {
    acceptanceCriteria: string;
    featureRequirements: string;
    description: string;
  }) => {
    const request: GenerateTestCaseRequest = {
      feature_description: data.featureRequirements,
      acceptance_criteria: data.acceptanceCriteria,
      additional_context: data.description,
      priority: "medium",
      tags: [],
    };

    setPendingRequest(request);
    await handleGenerate(request);
  };

  return (
    <Box>
      {/* Duplicate Detection Dialog */}
      <Dialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
      >
        <DialogTitle>Duplicate Test Case Detected</DialogTitle>
        <DialogContent>
          <MuiTypography>
            A test case with the same feature description and acceptance
            criteria already exists.
          </MuiTypography>
          <MuiTypography sx={{ mt: 2, fontWeight: 600 }}>
            Title: {duplicateTestCase?.title}
          </MuiTypography>
          <MuiTypography>
            Description: {duplicateTestCase?.description}
          </MuiTypography>
        </DialogContent>
        <DialogActions>
          <MuiButton
            variant="contained"
            color="primary"
            onClick={() => {
              if (duplicateTestCase) {
                setGeneratedTestCases([duplicateTestCase]);
                enqueueSnackbar("Using existing test case.", {
                  variant: "info",
                });
              }
              setDuplicateDialogOpen(false);
            }}
          >
            Use Existing
          </MuiButton>
          <MuiButton
            variant="outlined"
            color="secondary"
            onClick={async () => {
              if (!pendingRequest) {
                setDuplicateDialogOpen(false);
                return;
              }
              try {
                // Close the dialog immediately for better UX and start generation in background
                setDuplicateDialogOpen(false);
                setGenerating(true);
                // Call dedicated backend endpoint to generate a brand new test case
                const resp = await TestCaseService.generateNewTestCase(pendingRequest);
                // The backend returns a single test_case; show it and close dialog
                setGeneratedTestCases([resp.test_case]);
                setSimilarTestCases((resp.similar_cases || []).map(sc => sc.test_case));
                enqueueSnackbar(
                  `Generated new test case: ${resp.test_case.title}`,
                  { variant: "success" }
                );
              } catch (e) {
                const message = e instanceof Error ? e.message : "Unknown error";
                enqueueSnackbar(`Error generating new test case: ${message}`, { variant: "error" });
              } finally {
                setGenerating(false);
              }
            }}
          >
            Generate New
          </MuiButton>
        </DialogActions>
      </Dialog>
      <Typography variant="h1" gutterBottom
      sx={{ mt: 6.5 }}>
        Generate Test Cases
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Create comprehensive test cases using AI. Choose between Jira
        integration or manual input based on your workflow.
      </Typography>

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} lg={6}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Jira Ticket" />
                <Tab label="Manual Input" />
              </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
              <JiraInputForm
                onSubmit={handleJiraSubmit}
                onGenerate={handleJiraGenerate}
                loading={jiraLoading || generating}
                similarLoading={similarLoading}
                error={jiraError}
                ticket={ticket}
                similarCases={similarCases}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <ManualInputForm
                onSubmit={handleManualSubmit}
                loading={generating}
              />
            </TabPanel>
          </Card>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} lg={6}>
          {generating && (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Generating Test Cases...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take a few moments while our AI analyzes your
                  requirements.
                </Typography>
              </CardContent>
            </Card>
          )}

          {generatedTestCases.length > 0 && !generating && (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      Generated Test Cases
                    </Typography>
                    <Chip
                      label={`${generatedTestCases.length} cases`}
                      color="primary"
                      size="small"
                    />
                  </Box>

                  <TestCasePreview testCases={generatedTestCases} />

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => setGeneratedTestCases([])}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (generatedTestCases.length > 0) {
                          // Save the generated test case first if it's new
                          const testCaseToReview = generatedTestCases[0];

                          // Navigate to review page with the test case ID
                          navigate(
                            `/review?highlight=${testCaseToReview.id}&focus=true`
                          );
                        }
                      }}
                    >
                      Review & Edit
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {similarTestCases.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Similar Test Cases Found
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      These existing test cases might be relevant to your
                      current requirements.
                    </Typography>

                    <TestCasePreview
                      testCases={similarTestCases}
                      variant="compact"
                      showReviewButton={true}
                      onReview={(id) => {
                        if (id) navigate(`/review?highlight=${id}&focus=true`);
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {!generating && generatedTestCases.length === 0 && (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Ready to Generate
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fill in the form on the left to start generating test cases.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Show similar cases from Jira fetch when available and nothing generated yet */}
          {!generating && generatedTestCases.length === 0 && similarCases && similarCases.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Similar Test Cases Found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  These existing test cases might be relevant to the fetched Jira ticket.
                </Typography>

                <TestCasePreview
                  testCases={similarCases.map((sc) => sc.test_case)}
                  variant="compact"
                  showReviewButton={true}
                  onReview={(id) => {
                    if (id) navigate(`/review?highlight=${id}&focus=true`);
                  }}
                />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestCaseGeneratorPage;
