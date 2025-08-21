import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as DuplicateIcon,
  Lightbulb as LightbulbIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import type { DuplicateTestCaseError } from '../types';

interface DuplicateTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorData: DuplicateTestCaseError | null;
  onRetry: (newName: string) => void;
}

const DuplicateTestCaseModal: React.FC<DuplicateTestCaseModalProps> = ({
  isOpen,
  onClose,
  errorData,
  onRetry,
}) => {
  const [newName, setNewName] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (errorData?.original_name) {
      setNewName(errorData.original_name);
    }
  }, [errorData]);

  const handleRetry = async () => {
    if (!newName.trim()) return;
    
    setIsRetrying(true);
    try {
      await onRetry(newName);
      onClose();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSuggestedName = (suggestedName: string) => {
    setNewName(suggestedName);
  };

  const isNameChanged = newName.trim() !== errorData?.original_name;

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2,
        background: (theme) => theme.palette.primary.main,
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DuplicateIcon />
          <Typography variant="h6" component="span">
            Test Case Already Exists
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Jira Issue Link */}
        {errorData?.jira_id && (
          <Alert 
            severity="info" 
            icon={<LinkIcon />}
            sx={{ 
              mb: 2,
              bgcolor: 'primary.50',
              color: 'primary.main',
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="body2">
              <strong>Linked to Jira Issue:</strong> {errorData.jira_id}
            </Typography>
          </Alert>
        )}

        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            bgcolor: 'warning.50',
            color: 'warning.dark',
            border: '1px solid',
            borderColor: 'warning.main',
          }}
        >
          <Typography variant="body2">
            This test case name already exists in Zephyr Scale.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom color="primary.main">
            Current Name:
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontFamily: 'monospace', 
              bgcolor: 'grey.50', 
              p: 1.5, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300',
              wordBreak: 'break-word',
            }}
          >
            {errorData?.original_name}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom color="primary.main">
            New Name:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter a unique test case name..."
            error={!isNameChanged && newName.trim() !== ''}
            helperText={
              !isNameChanged && newName.trim() !== '' 
                ? 'Please choose a different name'
                : ' '
            }
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        </Box>

        {errorData?.suggested_names && errorData.suggested_names.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LightbulbIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" color="primary.main">
                Quick Options:
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {errorData.suggested_names.map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  onClick={() => handleSuggestedName(suggestion)}
                  variant="outlined"
                  clickable
                  size="small"
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 1, 
        bgcolor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'grey.200',
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ 
            color: 'grey.600',
            borderColor: 'grey.400',
            '&:hover': {
              borderColor: 'grey.600',
              bgcolor: 'grey.100',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleRetry}
          variant="contained"
          disabled={!isNameChanged || !newName.trim() || isRetrying}
          sx={{ 
            minWidth: 140,
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
            }
          }}
        >
          {isRetrying ? 'Retrying...' : 'Retry with New Name'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateTestCaseModal;