import React, { useEffect, useState } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { MainLayout, Board } from './components';
import { useDeployedBoardContext } from './hooks';
import { theme } from './config/theme';
import { Observable } from 'rxjs';
import { BoardDeployment } from './contexts';

const App: React.FC = () => {
  const boardApiProvider = useDeployedBoardContext();
  const [deployments, setDeployments] = useState<Observable<BoardDeployment>[]>([]);

  useEffect(() => {
    const subscription = boardApiProvider.boardDeployments$.subscribe(
      (newDeployments) => setDeployments(newDeployments)
    );
    return () => subscription.unsubscribe();
  }, [boardApiProvider]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a237e 0%, #000051 100%)',
        py: 4
      }}>
        <MainLayout>
          <>
            {deployments.map((deployment, idx) => (
              <div data-testid={`board-${idx}`} key={`board-${idx}`}>
                <Board boardDeployment$={deployment} />
              </div>
            ))}
            <div data-testid="board-start">
              <Board />
            </div>
          </>
        </MainLayout>
      </Box>
    </ThemeProvider>
  );
};

export default App;
