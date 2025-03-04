import { AppBar, Container, Grid, Toolbar, Typography } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import React from 'react';

/**
 * The props required by the {@link MainLayout} component.
 */
export interface MainLayoutProps {
  /** The content to render in the main layout. */
  children: React.ReactNode;
}

/**
 * A layout component that provides common UI elements, such as navigation, headers, footers, etc.
 */
export const MainLayout: React.FC<Readonly<MainLayoutProps>> = ({ children }) => (
  <React.Fragment>
    <AppBar position="sticky" color="primary">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <BadgeIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            MIDNIGHT PASSPORT VERIFY
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
    <Container
      component="main"
      maxWidth="lg"
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {children}
    </Container>
  </React.Fragment>
);
