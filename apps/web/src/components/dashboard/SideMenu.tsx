'use client';
import { styled } from '@mui/material/styles';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { CustomIcon } from './AppNavbar';
import { SiteSelect } from './SiteSelect';
import MenuContent from './MenuContent';
import CardAlert from './CardAlert';
import DataSourceStatus from './DataSourceStatus';
import { useT } from '@/i18n';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: { width: drawerWidth, boxSizing: 'border-box' },
});

// Repris de SideMenu.tsx du template.
export default function SideMenu() {
  const t = useT();
  return (
    <Drawer
      variant="permanent"
      sx={{ display: { xs: 'none', md: 'block' }, [`& .${drawerClasses.paper}`]: { backgroundColor: 'background.paper' } }}
    >
      <Stack component={NextLink} href="/" direction="row" aria-label={t.nav.homeLink}
        sx={{ alignItems: 'center', gap: 1.25, px: 2, pt: 'calc(var(--template-frame-height, 0px) + 16px)', pb: 0.5, color: 'text.primary', textDecoration: 'none' }}>
        <CustomIcon size="1.9rem" />
        <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.01em' }}>LunaSite</Typography>
      </Stack>
      <Box sx={{ display: 'flex', p: 1.5 }}>
        <SiteSelect />
      </Box>
      <Divider />
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <MenuContent />
        <CardAlert />
      </Box>
      <DataSourceStatus />
    </Drawer>
  );
}
