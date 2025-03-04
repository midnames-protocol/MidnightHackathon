import React, { useCallback, useEffect, useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  Backdrop,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Skeleton,
  Typography,
  Box,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CopyIcon from '@mui/icons-material/ContentPasteOutlined';
import StopIcon from '@mui/icons-material/HighlightOffOutlined';
import { type BBoardDerivedState, type DeployedBBoardAPI } from '@midnight-ntwrk/bboard-api';
import { useDeployedBoardContext } from '../hooks';
import { type BoardDeployment } from '../contexts';
import { type Observable } from 'rxjs';
import { EmptyCardContent } from './Board.EmptyCardContent';
import { PassportVerification } from './PassportVerification';
import { PassportFormData } from './PassportDataForm';

/** The props required by the {@link Board} component. */
export interface BoardProps {
  /** The observable bulletin board deployment. */
  boardDeployment$?: Observable<BoardDeployment>;
}

/**
 * Provides the UI for a deployed passport verification contract.
 */
export const Board: React.FC<Readonly<BoardProps>> = ({ boardDeployment$ }) => {
  const boardApiProvider = useDeployedBoardContext();
  const [boardDeployment, setBoardDeployment] = useState<BoardDeployment>();
  const [deployedBoardAPI, setDeployedBoardAPI] = useState<DeployedBBoardAPI>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [boardState, setBoardState] = useState<BBoardDerivedState>();
  const [isWorking, setIsWorking] = useState(!!boardDeployment$);

  // Callbacks for creating and joining boards
  const onCreateBoard = useCallback(
    (passportData: PassportFormData) => boardApiProvider.resolve(undefined, passportData),
    [boardApiProvider]
  );
  
  const onJoinBoard = useCallback(
    (contractAddress: ContractAddress) => boardApiProvider.resolve(contractAddress),
    [boardApiProvider]
  );

  const onCopyContractAddress = useCallback(async () => {
    if (deployedBoardAPI) {
      await navigator.clipboard.writeText(deployedBoardAPI.deployedContractAddress);
    }
  }, [deployedBoardAPI]);

  // Subscribes to the `boardDeployment$` observable so that we can receive updates on the deployment.
  useEffect(() => {
    if (!boardDeployment$) {
      return;
    }

    const subscription = boardDeployment$.subscribe(setBoardDeployment);

    return () => {
      subscription.unsubscribe();
    };
  }, [boardDeployment$]);

  // Subscribes to the `state$` observable on a `DeployedBBoardAPI` if we receive one
  useEffect(() => {
    if (!boardDeployment) {
      return;
    }
    if (boardDeployment.status === 'in-progress') {
      return;
    }

    setIsWorking(false);

    if (boardDeployment.status === 'failed') {
      setErrorMessage(
        boardDeployment.error.message.length ? boardDeployment.error.message : 'Encountered an unexpected error.',
      );
      return;
    }

    setDeployedBoardAPI(boardDeployment.api);
    const subscription = boardDeployment.api.state$.subscribe(setBoardState);
    return () => {
      subscription.unsubscribe();
    };
  }, [boardDeployment, setIsWorking, setErrorMessage, setDeployedBoardAPI]);

  return (
    <Box sx={{ maxWidth: '100%', width: 800, mx: 'auto', px: 2 }}>
      {!boardDeployment$ && (
        <Card sx={{ mb: 4, backgroundColor: 'primary.dark', color: 'primary.contrastText' }}>
          <EmptyCardContent onCreateBoardCallback={onCreateBoard} onJoinBoardCallback={onJoinBoard} />
        </Card>
      )}

      {boardDeployment$ && (
        <Card sx={{ position: 'relative', minHeight: 500, mb: 4 }}>
          <Backdrop
            sx={{ position: 'absolute', color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={isWorking}
          >
            <CircularProgress data-testid="board-working-indicator" />
          </Backdrop>
          <Backdrop
            sx={{ position: 'absolute', color: '#ff0000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={!!errorMessage}
          >
            <StopIcon fontSize="large" />
            <Typography component="div" data-testid="board-error-message">
              {errorMessage}
            </Typography>
          </Backdrop>

          <CardHeader
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '& .MuiCardHeader-subheader': {
                color: 'primary.contrastText'
              }
            }}
            avatar={
              boardState ? (
                <LockOpenIcon data-testid="passport-icon" sx={{ color: 'primary.contrastText' }} />
              ) : (
                <Skeleton variant="circular" width={24} height={24} />
              )
            }
            title={
              <Typography variant="h6" component="div">
                {toShortFormatContractAddress(deployedBoardAPI?.deployedContractAddress) ?? 'Loading...'}
              </Typography>
            }
            subheader="Age Verification Contract"
            action={
              deployedBoardAPI?.deployedContractAddress ? (
                <IconButton 
                  title="Copy contract address" 
                  onClick={onCopyContractAddress}
                  sx={{ color: 'primary.contrastText' }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              ) : (
                <Skeleton variant="circular" width={24} height={24} />
              )
            }
          />

          <CardContent sx={{ p: 4 }}>
            {deployedBoardAPI ? (
              <PassportVerification deployedBoardAPI={deployedBoardAPI} />
            ) : (
              <Skeleton variant="rectangular" width="100%" height={400} />
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

/** @internal */
const toShortFormatContractAddress = (contractAddress: ContractAddress | undefined): JSX.Element | undefined =>
  contractAddress ? (
    <span data-testid="board-address">
      0x{contractAddress?.replace(/^[A-Fa-f0-9]{6}([A-Fa-f0-9]{8}).*([A-Fa-f0-9]{8})$/g, '$1...$2')}
    </span>
  ) : undefined;
