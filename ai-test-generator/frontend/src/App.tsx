import React from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

// Pages
import HomePage from './pages/HomePage';
import TestCaseGeneratorPage from './pages/TestCaseGeneratorPage';
import TestCaseReviewPage from './pages/TestCaseReviewPage';
import TestCaseLibraryPage from './pages/TestCaseLibraryPage';

// Components
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <ErrorBoundary>
          <Router>
            <ScrollToTop />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              {/* App Bar */}
              <AppBar position="fixed" elevation={0}>
                <Toolbar>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    AI Test Case Generator
                  </Typography>
                </Toolbar>
              </AppBar>

              {/* Main Content */}
              <Box sx={{ display: 'flex', flex: 1 }}>
                {/* Side Navigation */}
                <Navigation />

                {/* Page Content */}
                <Box
                  component="main"
                  sx={{
                    flex: 1,
                    p: 3,
                    backgroundColor: 'background.default',
                  }}
                >
                  <Container maxWidth="xl">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/generate" element={<TestCaseGeneratorPage />} />
                      <Route path="/review" element={<TestCaseReviewPage />} />
                      <Route path="/library" element={<TestCaseLibraryPage />} />
                    </Routes>
                  </Container>
                </Box>
              </Box>
            </Box>
          </Router>
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
