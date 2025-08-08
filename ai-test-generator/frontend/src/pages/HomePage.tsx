import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Speed as SpeedIcon,
  CloudUpload as IntegrationIcon,
  Memory as MemoryIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: <AIIcon color="primary" />,
    title: 'AI-Powered Generation',
    description: 'Generate comprehensive test cases using advanced AI models',
  },
  {
    icon: <IntegrationIcon color="primary" />,
    title: 'Jira Integration',
    description: 'Seamlessly fetch requirements from Jira tickets',
  },
  {
    icon: <MemoryIcon color="primary" />,
    title: 'Smart Memory',
    description: 'Reuse and adapt similar test cases from previous projects',
  },
  {
    icon: <SpeedIcon color="primary" />,
    title: 'Fast Workflow',
    description: 'From requirements to Zephyr Scale in minutes',
  },
];

const workflowSteps = [
  'Input acceptance criteria manually or via Jira ticket',
  'AI generates comprehensive test cases',
  'Review and edit generated test cases',
  'Push approved test cases to Zephyr Scale',
];

/**
 * Home page with overview and quick start options
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 6,
          mb: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h1" gutterBottom>
          AI Test Case Generator
        </Typography>
        <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
          Transform your acceptance criteria into comprehensive test cases
          using the power of AI, integrated with Jira and Zephyr Scale.
        </Typography>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowIcon />}
          onClick={() => navigate('/generate')}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'grey.100',
            },
          }}
        >
          Start Generating Test Cases
        </Button>
      </Paper>

      {/* Features Grid */}
      <Typography variant="h2" gutterBottom sx={{ mb: 3 }}>
        Key Features
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {feature.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Workflow Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h2" gutterBottom>
            Simple Workflow
          </Typography>
          <List>
            {workflowSteps.map((step, index) => (
              <ListItem key={index} sx={{ pl: 0 }}>
                <ListItemIcon>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {index + 1}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={step}
                  primaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
            ))}
          </List>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h2" gutterBottom>
            Quick Actions
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Generate from Jira Ticket
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter a Jira ticket ID or URL to automatically fetch requirements
                    and generate test cases.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/generate?type=jira')}
                  >
                    Start with Jira
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Manual Input
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manually enter acceptance criteria and feature requirements
                    to generate custom test cases.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/generate?type=manual')}
                  >
                    Manual Entry
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    View Test Library
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Browse and manage your existing test cases, find similar
                    tests, and track generation history.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/library')}
                  >
                    View Library
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
