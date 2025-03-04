import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Container, 
  Divider, 
  FormControl, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Select, 
  Typography, 
  TextField, 
  SelectChangeEvent 
} from '@mui/material';

/**
 * Represents passport data used for verification
 */
export interface PassportFormData {
  /** The nationality code */
  nationality: string;
  /** Date of birth */
  dateOfBirth: Date;
  /** Date when the passport was issued */
  dateOfEmission: Date;
  /** Date when the passport expires */
  expirationDate: Date;
}

// Nationality options
const nationalities = [
  { value: '000000AR', label: 'Argentine' },
  { value: '000000US', label: 'United States' },
  { value: '000000UK', label: 'United Kingdom' },
  { value: '000000CA', label: 'Canada' },
  { value: '000000FR', label: 'France' },
  { value: '000000DE', label: 'Germany' },
  { value: '000000JP', label: 'Japan' },
  { value: '000000AU', label: 'Australia' },
];

// Helper function to convert a date string to a Date object
const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Format date to YYYY-MM-DD for input fields
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

interface PassportDataFormProps {
  onSubmit: (formData: PassportFormData) => void;
  isLoading?: boolean;
}

export const PassportDataForm: React.FC<PassportDataFormProps> = ({ onSubmit, isLoading = false }) => {
  // Form state - using strings for date inputs
  const [nationality, setNationality] = useState<string>('000000AR');
  const [dateOfBirth, setDateOfBirth] = useState<string>(formatDateForInput(new Date(1999, 0, 1)));
  const [dateOfEmission, setDateOfEmission] = useState<string>(formatDateForInput(new Date(2020, 0, 1)));
  const [expirationDate, setExpirationDate] = useState<string>(formatDateForInput(new Date(2030, 0, 1)));
  
  // Validation state
  const [formValid, setFormValid] = useState<boolean>(false);

  // Validate the form whenever inputs change
  useEffect(() => {
    const isValid = 
      !!nationality && 
      !!dateOfBirth && 
      !!dateOfEmission && 
      !!expirationDate;
    
    setFormValid(isValid);
  }, [nationality, dateOfBirth, dateOfEmission, expirationDate]);

  const handleNationalityChange = (event: SelectChangeEvent) => {
    setNationality(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!dateOfBirth || !dateOfEmission || !expirationDate) {
      return; // Prevent submission if dates are missing
    }
    
    onSubmit({
      nationality,
      dateOfBirth: parseDate(dateOfBirth),
      dateOfEmission: parseDate(dateOfEmission),
      expirationDate: parseDate(expirationDate)
    });
  };

  return (
    <Container maxWidth="md">
      <Card>
        <CardHeader 
          title="Passport Information" 
          subheader="Enter your passport details to create your digital identity" 
        />
        <Divider />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="nationality-label">Nationality</InputLabel>
                  <Select
                    labelId="nationality-label"
                    id="nationality"
                    value={nationality}
                    label="Nationality"
                    onChange={handleNationalityChange}
                  >
                    {nationalities.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Date of Emission"
                  type="date"
                  value={dateOfEmission}
                  onChange={(e) => setDateOfEmission(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Expiration Date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!formValid || isLoading}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Passport Data'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PassportDataForm;
