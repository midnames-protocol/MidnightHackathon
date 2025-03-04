import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CardContent,
  FormHelperText,
  Grid,
  TextField,
  Card,
  Dialog,
  DialogContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Observable } from 'rxjs';
import { BoardDeployment } from '../contexts';
import { PassportDataForm, PassportFormData } from './PassportDataForm';

interface EmptyCardContentProps {
  onCreateBoardCallback: (passportData: PassportFormData) => Observable<BoardDeployment>;
  onJoinBoardCallback: (contractAddress: ContractAddress) => Observable<BoardDeployment>;
}

export const EmptyCardContent: React.FC<EmptyCardContentProps> = ({
  onCreateBoardCallback,
  onJoinBoardCallback,
}) => {
  const [joinAddress, setJoinAddress] = useState('');
  const [joinAddressError, setJoinAddressError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreateBoard = (passportData: PassportFormData) => {
    onCreateBoardCallback(passportData);
    setIsFormOpen(false);
  };

  const handleJoinBoard = () => {
    if (joinAddress) {
      // Validate perhaps?
      onJoinBoardCallback(joinAddress);
    } else {
      setJoinAddressError('Please enter a contract address');
    }
  };

  return (
    <CardContent>
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="h5" gutterBottom component="div" sx={{ fontWeight: 500 }}>
          Passport Age Verification
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }} component="div">
          Verify your age using passport data with zero-knowledge proofs
        </Typography>

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <Button
              onClick={() => setIsFormOpen(true)}
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              size="large"
            >
              Create New Verification
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mt: 2, mb: 1 }} component="div">
              Or join an existing verification:
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <TextField
                label="Contract Address"
                placeholder="Enter contract address"
                fullWidth
                value={joinAddress}
                onChange={(event) => {
                  setJoinAddress(event.target.value);
                  setJoinAddressError('');
                }}
                error={!!joinAddressError}
                helperText={joinAddressError}
                size="small"
              />
              <Button
                onClick={handleJoinBoard}
                startIcon={<LinkIcon />}
                disabled={!joinAddress}
                sx={{ ml: 1 }}
                variant="outlined"
              >
                Join
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <PassportDataForm onSubmit={handleCreateBoard} />
        </DialogContent>
      </Dialog>
    </CardContent>
  );
};
