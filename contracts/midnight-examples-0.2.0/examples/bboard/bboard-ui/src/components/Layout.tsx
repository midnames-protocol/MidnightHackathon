import React from 'react';
import { Box, Container, Typography } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<Readonly<LayoutProps>> = ({ children }) => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Passport Verification System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Securely verify passport details using zero-knowledge proofs
        </Typography>
        {children}
      </Box>
    </Container>
  );
};