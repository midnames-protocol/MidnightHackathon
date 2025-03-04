import React, { useState, useEffect, useRef } from 'react';
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
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import socketService from '../services/SocketService';
import { mapRequestDataToPassportData } from '../models/PassportDataMapper';
import { RequestData } from '../models/RequestData';

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
  /** Passport document number */
  documentNumber?: string;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** Gender */
  gender?: string;
  /** Issuing state/country */
  issuingState?: string;
  /** Public key */
  pubkey?: string;
}

// Updated nationality options to match 3-letter country codes from passport data
const nationalities = [
  { value: 'ARG', label: 'Argentine' },
  { value: 'USA', label: 'United States' },
  { value: 'GBR', label: 'United Kingdom' },
  { value: 'CAN', label: 'Canada' },
  { value: 'FRA', label: 'France' },
  { value: 'DEU', label: 'Germany' },
  { value: 'JPN', label: 'Japan' },
  { value: 'AUS', label: 'Australia' },
];

// Helper function to convert a date string to a Date object
const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Format date to YYYY-MM-DD for input fields
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to get country label from country code
const getCountryLabel = (code: string): string => {
  const country = nationalities.find(n => n.value === code);
  return country ? country.label : code;
};

interface PassportDataFormProps {
  onSubmit: (formData: PassportFormData) => void;
  isLoading?: boolean;
}

export const PassportDataForm: React.FC<PassportDataFormProps> = ({ onSubmit, isLoading = false }) => {
  // Form state - using strings for date inputs
  const [nationality, setNationality] = useState<string>('ARG');
  const [dateOfBirth, setDateOfBirth] = useState<string>(formatDateForInput(new Date(1999, 0, 1)));
  const [dateOfEmission, setDateOfEmission] = useState<string>(formatDateForInput(new Date(2020, 0, 1)));
  const [expirationDate, setExpirationDate] = useState<string>(formatDateForInput(new Date(2030, 0, 1)));
  
  // Add additional state variables for the new fields
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [issuingState, setIssuingState] = useState<string>('');
  const [pubkey, setPubkey] = useState<string>('');
  
  // App data loading states
  const [loadingFromApp, setLoadingFromApp] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingSuccess, setLoadingSuccess] = useState<boolean>(false);

  // Validation state
  const [formValid, setFormValid] = useState<boolean>(false);

  // Add server status state
  const [isServerAvailable, setIsServerAvailable] = useState<boolean | null>(null);

  // Reference to store the timeout ID so we can clear it
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validate the form whenever inputs change
  useEffect(() => {
    const isValid = 
      !!nationality && 
      !!dateOfBirth && 
      !!dateOfEmission && 
      !!expirationDate;
    
    setFormValid(isValid);
  }, [nationality, dateOfBirth, dateOfEmission, expirationDate]);

  // Check server availability and set up the socket connection
  useEffect(() => {
    const checkServerAndConnect = async () => {
      try {
        const isAvailable = await socketService.checkServerAvailability();
        setIsServerAvailable(isAvailable);
        
        if (isAvailable) {
          socketService.connect();
        }
      } catch (error) {
        console.error('Error checking server availability:', error);
        setIsServerAvailable(false);
      }
    };
    
    checkServerAndConnect();
    
    // Clean up on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Handle socket connection and data reception
  useEffect(() => {
    // Connect to the socket when component mounts
    socketService.connect();

    // Handler for data from app
    const handleNewData = (data: RequestData) => {
      if (loadingFromApp) {
        console.log('Received passport data from app:', data);
        const passportData = mapRequestDataToPassportData(data);
        
        if (passportData) {
          // Update form with received data - use the exact nationality code from passport
          setNationality(passportData.nationality);
          setDateOfBirth(formatDateForInput(passportData.dateOfBirth));
          setDateOfEmission(formatDateForInput(passportData.dateOfEmission));
          setExpirationDate(formatDateForInput(passportData.expirationDate));
          
          // Update additional fields if available
          if (passportData.documentNumber) setDocumentNumber(passportData.documentNumber);
          if (passportData.firstName) setFirstName(passportData.firstName);
          if (passportData.lastName) setLastName(passportData.lastName);
          if (passportData.gender) setGender(passportData.gender);
          if (passportData.issuingState) setIssuingState(passportData.issuingState);
          if (passportData.pubkey) setPubkey(passportData.pubkey);
          
          setLoadingSuccess(true);
          setLoadingError(null);
        } else {
          setLoadingError('Received data is not in the expected passport format');
        }
        
        setLoadingFromApp(false);
      }
    };

    // Register event listener
    socketService.addListener('new-data', handleNewData);

    // Cleanup function
    return () => {
      socketService.removeListener('new-data', handleNewData);
    };
  }, [loadingFromApp]);

  const handleNationalityChange = (event: SelectChangeEvent) => {
    setNationality(event.target.value);
    setLoadingSuccess(false);
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
      expirationDate: parseDate(expirationDate),
      documentNumber,
      firstName,
      lastName,
      gender,
      issuingState,
      pubkey
    });
  };

  const handleLoadFromApp = () => {
    // Check server status before attempting to load
    if (!isServerAvailable) {
      setLoadingError('Cannot connect to the passport data server. Please make sure the server is running.');
      return;
    }
    
    // Reset states
    setLoadingError(null);
    setLoadingSuccess(false);
    setLoadingFromApp(true);
    
    // Set a timeout to show error message if no data is received
    // Clear any existing timeout first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (loadingFromApp) {
        setLoadingFromApp(false);
        setLoadingError('No data received within the timeout period. Please try again.');
      }
    }, 30000); // 30-second timeout
  };

  const handleCancelLoading = () => {
    // Clear the timeout 
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset loading state
    setLoadingFromApp(false);
    setLoadingError(null);
  };

  const handleFieldChange = () => {
    setLoadingSuccess(false);
  };

  return (
    <Container maxWidth="md">
      <Card>
        <CardHeader 
          title="Passport Information" 
          subheader="Enter your passport details to create your digital identity" 
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {loadingFromApp ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCancelLoading}
                  sx={{ marginRight: 1 }}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                variant="contained"
                color="secondary"
                startIcon={loadingFromApp ? <CircularProgress size={24} /> : <CloudDownloadIcon />}
                onClick={handleLoadFromApp}
                disabled={loadingFromApp || isLoading || isServerAvailable === false}
                sx={{ marginRight: 2 }}
              >
                {loadingFromApp ? 'Waiting for data...' : 'Load from App'}
              </Button>
            </Box>
          }
        />
        <Divider />
        <CardContent>
          {isServerAvailable === false && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              Cannot connect to the passport data server. Please make sure the server is running at https://localhost:3000.
            </Alert>
          )}
          
          {loadingError && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {loadingError}
            </Alert>
          )}
          
          {loadingSuccess && (
            <Alert severity="success" sx={{ marginBottom: 2 }}>
              Successfully loaded passport data from app!
            </Alert>
          )}
          
          {loadingFromApp && (
            <Alert severity="info" sx={{ marginBottom: 2 }}>
              Waiting for passport data from the app. Please complete the process on your device.
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Document Number field */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Document Number"
                  value={documentNumber}
                  onChange={(e) => {
                    setDocumentNumber(e.target.value);
                    handleFieldChange();
                  }}
                  fullWidth
                  variant="outlined"
                  disabled={loadingFromApp}
                />
              </Grid>

              {/* First Name field */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    handleFieldChange();
                  }}
                  fullWidth
                  variant="outlined"
                  disabled={loadingFromApp}
                />
              </Grid>

              {/* Last Name field */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    handleFieldChange();
                  }}
                  fullWidth
                  variant="outlined"
                  disabled={loadingFromApp}
                />
              </Grid>

              {/* Nationality field */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="nationality-label">Nationality</InputLabel>
                  <Select
                    labelId="nationality-label"
                    id="nationality"
                    value={nationality}
                    label="Nationality"
                    onChange={handleNationalityChange}
                    disabled={loadingFromApp}
                  >
                    {nationalities.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label} ({option.value})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Gender field */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    id="gender"
                    value={gender}
                    label="Gender"
                    onChange={(e) => {
                      setGender(e.target.value);
                      handleFieldChange();
                    }}
                    disabled={loadingFromApp}
                  >
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Issuing State field */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Issuing State"
                  value={issuingState}
                  onChange={(e) => {
                    setIssuingState(e.target.value);
                    handleFieldChange();
                  }}
                  fullWidth
                  variant="outlined"
                  helperText={issuingState ? `Country code: ${issuingState}` : ''}
                  disabled={loadingFromApp}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    handleFieldChange();
                  }}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled={loadingFromApp}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Date of Emission"
                  type="date"
                  value={dateOfEmission}
                  onChange={(e) => {
                    setDateOfEmission(e.target.value);
                    handleFieldChange();
                  }}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled={loadingFromApp}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Expiration Date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => {
                    setExpirationDate(e.target.value);
                    handleFieldChange();
                  }}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled={loadingFromApp}
                />
              </Grid>

              {/* Public Key field */}
              <Grid item xs={12}>
                <TextField
                  label="Public Key"
                  value={pubkey}
                  onChange={(e) => {
                    setPubkey(e.target.value);
                    handleFieldChange();
                  }}
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={4}
                  disabled={loadingFromApp}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!formValid || isLoading || loadingFromApp}
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
