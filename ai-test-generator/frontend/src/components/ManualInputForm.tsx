import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
} from '@mui/material';

interface ManualInputData {
  acceptanceCriteria: string;
  featureRequirements: string;
  description: string;
}

interface ManualInputFormProps {
  onSubmit: (data: ManualInputData) => Promise<void>;
  loading: boolean;
}

const ManualInputForm: React.FC<ManualInputFormProps> = ({
  onSubmit,
  loading,
}) => {
  const [formData, setFormData] = useState<ManualInputData>({
    acceptanceCriteria: '',
    featureRequirements: '',
    description: '',
  });

  const handleChange = (field: keyof ManualInputData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.acceptanceCriteria.trim() || formData.description.trim()) {
      await onSubmit(formData);
    }
  };

  const isFormValid = formData.acceptanceCriteria.trim() || formData.description.trim();

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Manual Requirements Input
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="User Story"
            placeholder="Enter feature requirements..."
            value={formData.featureRequirements}
            onChange={handleChange('featureRequirements')}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Acceptance Criteria"
            placeholder="Enter acceptance criteria..."
            value={formData.acceptanceCriteria}
            onChange={handleChange('acceptanceCriteria')}
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Information"
            placeholder="Enter feature description..."
            value={formData.description}
            onChange={handleChange('description')}
            disabled={loading}
          />
        </Grid>
        

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !isFormValid}
          >
            {loading ? 'Generating...' : 'Generate Test Cases'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManualInputForm;
