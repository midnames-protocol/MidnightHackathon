import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Divider, 
  Grid, 
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Alert,
  Paper,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import { type DeployedBBoardAPI } from '@midnight-ntwrk/bboard-api';

interface PassportVerificationProps {
  deployedBoardAPI?: DeployedBBoardAPI;
}

export const PassportVerification: React.FC<Readonly<PassportVerificationProps>> = ({ deployedBoardAPI }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifyingAge, setIsVerifyingAge] = useState(false);
  const [ageValid, setAgeValid] = useState<boolean | null>(null);
  const [userRegistered, setUserRegistered] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    'Register with Passport',
    'Verify Age (21+)',
    'Access Granted'
  ];

  const handleRegisterUser = async () => {
    if (!deployedBoardAPI) return;
    
    setIsRegistering(true);
    setError(null);
    
    try {
      await deployedBoardAPI.create_user();
      setUserRegistered(true);
      setActiveStep(1); // Move to age verification step
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setUserRegistered(false);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerifyAge = async () => {
    if (!deployedBoardAPI) return;
    
    setIsVerifyingAge(true);
    setError(null);
    
    try {
      await deployedBoardAPI.validate_adulthood();
      setAgeValid(true);
      setActiveStep(2); // Move to completion step
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setAgeValid(false);
    } finally {
      setIsVerifyingAge(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Register with Your Passport
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Your passport data will be securely verified using zero-knowledge proofs.
                    No personal information is stored on the blockchain.
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    size="large"
                    disabled={isRegistering || userRegistered === true}
                    onClick={handleRegisterUser}
                    startIcon={isRegistering ? <CircularProgress size={20} /> : <LockIcon />}
                  >
                    {isRegistering ? 'Registering...' : 'Secure Register with Passport'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Age Verification
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Verify that you are over 21 years old without revealing your actual birthdate.
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    fullWidth 
                    size="large"
                    disabled={isVerifyingAge}
                    onClick={handleVerifyAge}
                    startIcon={isVerifyingAge ? <CircularProgress size={20} /> : <SecurityIcon />}
                  >
                    {isVerifyingAge ? 'Verifying...' : 'Verify Age (21+)'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                Verification Complete
              </Typography>
              <Typography variant="body2">
                Your age has been verified using zero-knowledge proofs. You can now access age-restricted content.
              </Typography>
            </Alert>
          </Box>
        );
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <CardHeader 
        title="Secure Age Verification" 
        subheader="Verify your age with passport data using zero-knowledge proofs"
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent(activeStep)}
        
        <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="textSecondary" align="center" display="block">
            Powered by Midnight Network's Zero-Knowledge Proofs
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
