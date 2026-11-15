'use client';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import SideMenu from './SideMenu';
import AppNavbar from './AppNavbar';
import Header, { PeriodControls } from './Header';
import { useDashboard } from './DashboardState';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { usePathname } from 'next/navigation';

/** Structure de Dashboard.tsx du template : SideMenu + AppNavbar + main (Header puis contenu). */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { days, setDays } = useDashboard();
  const live = usePathname() === '/horizon';
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
        <Stack spacing={2} sx={{ alignItems: 'center', mx: { xs: 2, md: 3 }, pb: 0, mt: { xs: 10, md: 0 } }}>
          <Header />
          {!live && (
            <Stack direction="row" sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, width: '100%', flexWrap: 'wrap' }}>
              <PeriodControls days={days} setDays={setDays} />
            </Stack>
          )}
          <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            {children}
            <SiteFooter />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
