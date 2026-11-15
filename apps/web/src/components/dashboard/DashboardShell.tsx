'use client';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SideMenu from './SideMenu';
import AppNavbar from './AppNavbar';
import Header, { PeriodControls } from './Header';
import { useDashboard } from './DashboardState';

/** Structure de Dashboard.tsx du template : SideMenu + AppNavbar + main (Header puis contenu). */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { days, setDays } = useDashboard();
  return (
    <Box sx={{ display: 'flex' }}>
      <SideMenu />
      <AppNavbar />
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          minWidth: 0,
          minHeight: '100vh',
          backgroundColor: theme.vars ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)` : alpha(theme.palette.background.default, 1),
          overflow: 'auto',
        })}
      >
        <Stack spacing={2} sx={{ alignItems: 'center', mx: { xs: 2, md: 3 }, pb: 5, mt: { xs: 10, md: 0 } }}>
          <Header />
          <Stack direction="row" sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, width: '100%', flexWrap: 'wrap' }}>
            <PeriodControls days={days} setDays={setDays} />
          </Stack>
          <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>{children}</Box>
          <Typography variant="body2" align="center" sx={{ color: 'text.secondary', my: 4 }}>
            LunaSite · NASA Space Apps Challenge 2026 · Données NASA LOLA (PDS) · éphémérides astronomy-engine
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
