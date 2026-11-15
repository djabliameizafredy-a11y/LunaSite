'use client';
import Divider from '@mui/material/Divider';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { SiteSelect } from './SiteSelect';
import MenuContent from './MenuContent';
import CardAlert from './CardAlert';
import DataSourceStatus from './DataSourceStatus';

interface SideMenuMobileProps {
  open: boolean | undefined;
  toggleDrawer: (newOpen: boolean) => () => void;
}

// Repris de SideMenuMobile.tsx du template (tiroir à droite) ; en-tête utilisateur remplacé par le choix du site.
export default function SideMenuMobile({ open, toggleDrawer }: SideMenuMobileProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={toggleDrawer(false)}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        [`& .${drawerClasses.paper}`]: { backgroundImage: 'none', backgroundColor: 'background.paper' },
      }}
    >
      <Stack sx={{ maxWidth: '70dvw', height: '100%' }}>
        <Box sx={{ p: 2, pb: 1.5 }}><SiteSelect /></Box>
        <Divider />
        <Stack sx={{ flexGrow: 1 }}>
          <MenuContent onNavigate={toggleDrawer(false)} />
          <Divider />
        </Stack>
        <CardAlert onNavigate={toggleDrawer(false)} />
        <DataSourceStatus />
      </Stack>
    </Drawer>
  );
}
