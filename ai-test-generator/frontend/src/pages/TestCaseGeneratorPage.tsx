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
import { useSearchParams } from "react-router-dom";
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
    loading: jiraLoading,
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
      await fetchTicket(ticketIdOrUrl);

      // After fetching ticket, generate test cases
      if (ticket) {
        const request: GenerateTestCaseRequest = {
          feature_description: ticket.summary,
          acceptance_criteria: ticket.acceptanceCriteria.join("\n"),
          additional_context: ticket.description,
          priority: "medium",
          tags: [ticket.key],
        };

        await handleGenerate(request);
      }
    } catch (error) {
      // Error handling is done in the useJira hook
      console.error("Jira fetch error:", error);
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
              // Force new generation by adding a random tag or context
              if (pendingRequest) {
                const newRequest = {
                  ...pendingRequest,
                  additional_context:
                    (pendingRequest.additional_context || "") +
                    " [force new generation " +
                    Date.now() +
                    "]",
                };
                setDuplicateDialogOpen(false);
                await handleGenerate(newRequest);
              }
            }}
          >
            Generate New
          </MuiButton>
        </DialogActions>
      </Dialog>
      <Typography variant="h1" gutterBottom>
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
                loading={jiraLoading || generating}
                error={jiraError}
                ticket={ticket}
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
                        // Navigate to review page with generated test cases
                        // This would be implemented with proper state management
                        enqueueSnackbar("Navigate to review page", {
                          variant: "info",
                        });
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
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestCaseGeneratorPage;
