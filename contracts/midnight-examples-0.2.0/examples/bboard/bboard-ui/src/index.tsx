import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { DeployedBoardProvider } from './contexts/DeployedBoardContext';
import { logger } from './logger';
import { ThemeProvider } from '@mui/material';
import { theme } from './config/theme';
import CssBaseline from '@mui/material/CssBaseline';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DeployedBoardProvider logger={logger}>
        <App />
      </DeployedBoardProvider>
    </ThemeProvider>
  </React.StrictMode>
);
