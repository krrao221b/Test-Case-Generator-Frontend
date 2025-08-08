import React from 'react';
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
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { TestCase } from '../types';

interface TestCasePreviewProps {
  testCases: TestCase[];
  variant?: 'full' | 'compact';
}

const TestCasePreview: React.FC<TestCasePreviewProps> = ({
  testCases,
  variant = 'full',
}) => {
  if (testCases.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No test cases to display
        </Typography>
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Box>
        {testCases.map((testCase, index) => (
          <Card key={index} sx={{ mb: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  {testCase.name}
                </Typography>
                <Chip 
                  label={testCase.priority} 
                  size="small" 
                  color={
                    testCase.priority === 'Critical' ? 'error' :
                    testCase.priority === 'High' ? 'warning' :
                    testCase.priority === 'Medium' ? 'info' : 'default'
                  }
                />
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                {testCase.name}
              </Typography>
              <Chip 
                label={testCase.priority} 
                size="small"
                color={
                  testCase.priority === 'Critical' ? 'error' :
                  testCase.priority === 'High' ? 'warning' :
                  testCase.priority === 'Medium' ? 'info' : 'default'
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
              {testCase.steps.map((step: any, stepIndex: number) => (
                <React.Fragment key={stepIndex}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={`Step ${step.stepNumber}: ${step.action}`}
                      secondary={
                        <Box>
                          {step.testData && (
                            <Typography variant="body2" component="div">
                              <strong>Test Data:</strong> {step.testData}
                            </Typography>
                          )}
                          <Typography variant="body2" component="div">
                            <strong>Expected Result:</strong> {step.expectedResult}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {stepIndex < testCase.steps.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default TestCasePreview;
