import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import type { TestCase } from "../types";
import { useNavigate } from "react-router-dom";

interface TestCasePreviewProps {
  testCases: TestCase[];
  variant?: "full" | "compact";
}

const TestCasePreview: React.FC<TestCasePreviewProps> = ({
  testCases,
  variant = "full",
}) => {
  const navigate = useNavigate();
  if (testCases.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No test cases to display
        </Typography>
      </Box>
    );
  }

  if (variant === "compact") {
    return (
      <Box>
        {testCases.map((testCase, index) => (
          <Card key={index} sx={{ mb: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  {testCase.title}
                </Typography>
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
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                  onClick={() => navigate(`/review?highlight=${testCase.id}&focus=true`)}
                >
                  Review & Edit
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {testCases.map((testCase, index) => (
        <Accordion key={index} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
              }}
            >
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                {testCase.title}
              </Typography>
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
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              {testCase.description}
            </Typography>

            {testCase.preconditions && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Preconditions:
                </Typography>
                <Typography variant="body2" paragraph>
                  {testCase.preconditions}
                </Typography>
              </>
            )}

            <Typography variant="subtitle2" gutterBottom>
              Test Steps:
            </Typography>

            <List dense>
              {testCase.test_steps.map((step: any, stepIndex: number) => (
                <React.Fragment key={stepIndex}>
                  <ListItem
                    sx={{ flexDirection: "column", alignItems: "flex-start" }}
                  >
                    <ListItemText
                      primary={`Step ${step.step_number}: ${step.action}`}
                      secondary={
                        <Box component="span">
                          {step.test_data && (
                            <Typography
                              variant="body2"
                              component="span"
                              display="block"
                            >
                              <strong>Test Data:</strong> {step.test_data}
                            </Typography>
                          )}
                          <Typography
                            variant="body2"
                            component="span"
                            display="block"
                          >
                            <strong>Expected Result:</strong>{" "}
                            {step.expected_result}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {stepIndex < testCase.test_steps.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate(`/review?highlight=${testCase.id}&focus=true`)}
              >
                Review & Edit
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default TestCasePreview;
