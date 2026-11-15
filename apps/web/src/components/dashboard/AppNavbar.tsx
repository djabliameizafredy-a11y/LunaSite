'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MuiToolbar from '@mui/material/Toolbar';
import { tabsClasses } from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SideMenuMobile from './SideMenuMobile';
import MenuButton from './MenuButton';
import ColorModeIconDropdown from '@/shared-theme/ColorModeIconDropdown';
import { SearchCommand } from './SearchCommand';

const Toolbar = styled(MuiToolbar)({
  width: '100%',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  justifyContent: 'center',
  gap: '12px',
  flexShrink: 0,
  [`& ${tabsClasses.list}`]: { gap: '8px', p: '8px', pb: 0 },
});

// Repris de AppNavbar.tsx du template (barre mobile).
export default function AppNavbar() {
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);

  return (
    <AppBar
      position="fixed"
      sx={{
        display: { xs: 'auto', md: 'none' },
        boxShadow: 0,
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        top: 'var(--template-frame-height, 0px)',
      }}
    >
      <Toolbar variant="regular">
        <Stack direction="row" sx={{ alignItems: 'center', flexGrow: 1, width: '100%', gap: 1 }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mr: 'auto' }}>
            <CustomIcon />
            <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>LunaSite</Typography>
          </Stack>
          <SearchCommand compact />
          <ColorModeIconDropdown />
          <MenuButton aria-label="menu" onClick={toggleDrawer(true)}>
            <MenuRoundedIcon />
          </MenuButton>
          <SideMenuMobile open={open} toggleDrawer={toggleDrawer} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

/** Logo LunaSite (marque officielle de l'équipe) : masque CSS, prend la couleur du texte (thème clair ou sombre). */
export function CustomIcon({ size = '1.75rem', color = 'text.primary' }: { size?: string; color?: string }) {
  return (
    <Box
      component="span"
      role="img"
      aria-label="LunaSite"
      sx={{
        display: 'inline-block',
        flex: '0 0 auto',
        width: size,
        height: size,
        alignSelf: 'center',
        bgcolor: 'currentColor',
        color,
        WebkitMask: 'url(/brand/logo-mark.png) center / contain no-repeat',
        mask: 'url(/brand/logo-mark.png) center / contain no-repeat',
      }}
    />
  );
}
