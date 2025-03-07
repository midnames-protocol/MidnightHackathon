import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Grid, 
  Typography,
  Box,
  Alert,
  Paper,
  useTheme,
  Divider,
  Chip,
  Tooltip,
  LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import PublicIcon from '@mui/icons-material/Public';
import EventIcon from '@mui/icons-material/Event';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import { type DeployedBBoardAPI } from '@midnight-ntwrk/bboard-api';

interface PassportVerificationProps {
  deployedBoardAPI?: DeployedBBoardAPI;
}

// Verification type definitions
type VerificationType = 'nationality' | 'age' | 'expiration';
type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error';

interface VerificationState {
  status: VerificationStatus;
  error: string | null;
}

const verificationConfig = {
  nationality: {
    title: 'Nationality Verification',
    description: 'Verify that you are Argentine without revealing your full passport data.',
    icon: PublicIcon,
    successMessage: 'Successfully verified Argentine nationality',
    color: 'primary'
  },
  age: {
    title: 'Age Verification (21+)',
    description: 'Verify that you are over 21 years old without revealing your actual birthdate.',
    icon: SecurityIcon,
    successMessage: 'Successfully verified age requirement (21+)',
    color: 'secondary'
  },
  expiration: {
    title: 'Passport Expiration',
    description: 'Verify that your passport is not expired without revealing the actual date.',
    icon: EventIcon,
    successMessage: 'Successfully verified passport is not expired',
    color: 'info'
  }
};

export const PassportVerification: React.FC<Readonly<PassportVerificationProps>> = ({ deployedBoardAPI }) => {
  const theme = useTheme();
  
  // Track verification status for each type
  const [verifications, setVerifications] = useState<Record<VerificationType, VerificationState>>({
    nationality: { status: 'idle', error: null },
    age: { status: 'idle', error: null },
    expiration: { status: 'idle', error: null }
  });

  const updateVerificationStatus = (type: VerificationType, status: VerificationStatus, error: string | null = null) => {
    setVerifications(prev => ({
      ...prev,
      [type]: { status, error }
    }));
  };

  const handleVerifyNationality = async () => {
    if (!deployedBoardAPI) return;
    
    updateVerificationStatus('nationality', 'verifying');
    
    try {
      console.log("Starting nationality verification");
      
      // Check current state to make sure we have passport data
      const currentState = await new Promise<any>((resolve) => {
        let subscription = deployedBoardAPI.state$.subscribe((state) => {
          resolve(state);
          subscription.unsubscribe();
        });
      });
      
      // Log the current state to check nationality format
      if (currentState && currentState.passport_data && currentState.passport_data.nationality) {
        const decoder = new TextDecoder();
        const nationalityBytes = currentState.passport_data.nationality;
        console.log("Current passport nationality bytes:", Array.from(nationalityBytes));
      } else {
        console.warn("No valid passport data found in current state");
      }
      
      // Add more detailed logging for debugging
      console.log("Calling validate_nationality method...");
      
      await deployedBoardAPI.validate_nationality();
      console.log("Nationality verification successful");
      updateVerificationStatus('nationality', 'success');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Nationality verification error:', errorMsg);
      
      // Provide user-friendly error messages based on contract validation errors
      let userMessage = errorMsg;
      if (errorMsg.includes("User is not argentine")) {
        userMessage = "The passport nationality was not verified as Argentine. This verification requires Argentine nationality.";
      } else if (errorMsg.includes("assert failed")) {
        userMessage = "Nationality verification failed with contract assertion error.";
      } else if (errorMsg.includes("Witness")) {
        userMessage = "Verification failed: Issue with generating the zero-knowledge proof.";
      } else if (errorMsg.includes("transaction")) {
        userMessage = "Transaction error: Please try again or check your wallet connection.";
      } else if (errorMsg.includes("wallet") || errorMsg.includes("sign")) {
        userMessage = "Wallet error: Unable to sign the transaction. Please check your wallet connection and permissions.";
      }
      
      console.log("User-friendly error message:", userMessage);
      updateVerificationStatus('nationality', 'error', userMessage);
    }
  };

  const handleVerifyAge = async () => {
    if (!deployedBoardAPI) return;
    
    updateVerificationStatus('age', 'verifying');
    
    try {
      console.log("Starting age verification");
      await deployedBoardAPI.validate_adulthood();
      console.log("Age verification successful");
      updateVerificationStatus('age', 'success');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Age verification error:', errorMsg);
      
      let userMessage = errorMsg;
      if (errorMsg.includes("User is not old enough")) {
        userMessage = "The passport shows you are not 21 or older. This verification requires users to be at least 21 years old.";
      } else if (errorMsg.includes("assert failed")) {
        userMessage = "Age verification failed with contract assertion error.";
      } else if (errorMsg.includes("Witness")) {
        userMessage = "Verification failed: Issue with generating the zero-knowledge proof.";
      } else if (errorMsg.includes("transaction")) {
        userMessage = "Transaction error: Please try again or check your wallet connection.";
      }
      
      updateVerificationStatus('age', 'error', userMessage);
    }
  };

  const handleVerifyExpiration = async () => {
    if (!deployedBoardAPI) return;
    
    updateVerificationStatus('expiration', 'verifying');
    
    try {
      console.log("Starting expiration verification");
      await deployedBoardAPI.passport_is_unexpired();
      console.log("Expiration verification successful");
      updateVerificationStatus('expiration', 'success');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Expiration verification error:', errorMsg);
      
      let userMessage = errorMsg;
      if (errorMsg.includes("Passport is expired")) {
        userMessage = "The passport appears to be expired. This verification requires a valid, unexpired passport.";
      } else if (errorMsg.includes("assert failed")) {
        userMessage = "Expiration verification failed with contract assertion error.";
      } else if (errorMsg.includes("Witness")) {
        userMessage = "Verification failed: Issue with generating the zero-knowledge proof.";
      } else if (errorMsg.includes("transaction")) {
        userMessage = "Transaction error: Please try again or check your wallet connection.";
      }
      
      updateVerificationStatus('expiration', 'error', userMessage);
    }
  };

  // Get overall verification status for the progress indicator
  const getOverallStatus = () => {
    const statusValues = Object.values(verifications);
    const successCount = statusValues.filter(s => s.status === 'success').length;
    const totalCount = Object.keys(verifications).length;
    
    return {
      progress: (successCount / totalCount) * 100,
      text: `${successCount} of ${totalCount} verifications completed`
    };
  };

  // Helper to render verification status
  const renderVerificationStatus = (type: VerificationType) => {
    const verification = verifications[type];
    const config = verificationConfig[type];
    
    switch (verification.status) {
      case 'success':
        return <Alert 
          severity="success" 
          icon={<CheckCircleIcon />}
          sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
        >
          {config.successMessage}
        </Alert>;
      case 'error':
        return <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          sx={{ mt: 2 }}
        >
          {verification.error}
        </Alert>;
      case 'verifying':
        return <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <LinearProgress sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ ml: 2 }}>Verifying...</Typography>
        </Box>;
      default:
        return null;
    }
  };

  // Helper to render status chip
  const renderStatusChip = (type: VerificationType) => {
    const verification = verifications[type];
    
    switch (verification.status) {
      case 'success':
        return <Chip 
          label="Verified" 
          color="success" 
          size="small" 
          icon={<CheckCircleIcon />} 
          sx={{ fontWeight: 500 }}
        />;
      case 'error':
        return <Chip 
          label="Failed" 
          color="error" 
          size="small" 
          icon={<ErrorIcon />} 
          sx={{ fontWeight: 500 }}
        />;
      case 'verifying':
        return <Chip 
          label="Verifying" 
          color="primary" 
          size="small" 
          icon={<CircularProgress size={12} />} 
          sx={{ fontWeight: 500 }}
        />;
      default:
        return <Chip 
          label="Not verified" 
          color="default" 
          size="small" 
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />;
    }
  };

  // Calculate overall progress
  const overallStatus = getOverallStatus();

  return (
    <Card sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VerifiedUserIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Passport Verifications</Typography>
          </Box>
        }
        subheader="Verify your passport data using zero-knowledge proofs"
        action={
          <Tooltip title="All verifications use zero-knowledge proofs to protect your personal information">
            <HelpIcon color="action" sx={{ mt: 1, cursor: 'pointer' }} />
          </Tooltip>
        }
      />
      
      <CardContent>
        {/* Overall Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Verification Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {overallStatus.text}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={overallStatus.progress} 
            sx={{ height: 8, borderRadius: 4 }}
            color="success"
          />
        </Box>
        
        <Grid container spacing={3}>
          {/* Render verification cards dynamically */}
          {(Object.entries(verificationConfig) as [VerificationType, typeof verificationConfig.nationality][]).map(([type, config]) => {
            const IconComponent = config.icon;
            const verification = verifications[type];
            const colorKey = config.color as 'primary' | 'secondary' | 'info';
            
            return (
              <Grid item xs={12} key={type}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    backgroundColor: theme.palette.background.default,
                    borderLeft: `4px solid ${theme.palette[colorKey].main}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconComponent sx={{ color: theme.palette[colorKey].main, mr: 1 }} />
                      <Typography variant="h6" gutterBottom>
                        {config.title}
                      </Typography>
                    </Box>
                    {renderStatusChip(type)}
                  </Box>

                  <Typography variant="body2" color="textSecondary" paragraph>
                    {config.description}
                  </Typography>
                  
                  {renderVerificationStatus(type)}
                  
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      variant={verification.status === 'success' ? 'outlined' : 'contained'} 
                      color={colorKey}
                      disabled={verification.status === 'verifying'}
                      onClick={
                        type === 'nationality' 
                        ? handleVerifyNationality 
                        : type === 'age' 
                        ? handleVerifyAge 
                        : handleVerifyExpiration
                      }
                      startIcon={verification.status === 'verifying' ? 
                        <CircularProgress size={20} /> : <IconComponent />}
                      fullWidth
                      sx={{
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {verification.status === 'verifying' 
                        ? 'Verifying...' 
                        : verification.status === 'success'
                        ? 'Verified'
                        : `Verify ${type === 'nationality' ? 'Nationality' : type === 'age' ? 'Age (21+)' : 'Passport Validity'}`
                      }
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
        
        <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="textSecondary" align="center" display="block">
            Powered by Midnight Network's Zero-Knowledge Proofs
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
