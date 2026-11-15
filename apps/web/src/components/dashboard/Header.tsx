'use client';
import { usePathname } from 'next/navigation';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import ColorModeIconDropdown from '@/shared-theme/ColorModeIconDropdown';
import CustomDatePicker from './CustomDatePicker';
import { useDashboard } from './DashboardState';

// Repris de NavbarBreadcrumbs.tsx du template.
const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: { color: (theme.vars || theme).palette.action.disabled, margin: 1 },
  [`& .${breadcrumbsClasses.ol}`]: { alignItems: 'center' },
}));

const TITLES: Record<string, string> = {
  '/dashboard': "Vue d'ensemble", '/sites': 'Catalogue des sites', '/limits': 'Données et limites',
};

// Repris de Header.tsx du template : fil d'Ariane à gauche ; à droite, période (au lieu de Search + notifications) et thème.
export default function Header() {
  const pathname = usePathname();
  const { days, setDays } = useDashboard();

  return (
    <Stack
      direction="row"
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '100%',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        maxWidth: { sm: '100%', md: '1700px' },
        pt: 1.5,
      }}
      spacing={2}
    >
      <StyledBreadcrumbs aria-label="fil d'Ariane" separator={<NavigateNextRoundedIcon fontSize="small" />}>
        <Typography variant="body1">LunaSite</Typography>
        <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>{TITLES[pathname] ?? ''}</Typography>
      </StyledBreadcrumbs>
      <Stack direction="row" sx={{ gap: 1 }}>
        <PeriodControls days={days} setDays={setDays} />
        <ColorModeIconDropdown />
      </Stack>
    </Stack>
  );
}

/** Jour de début + durée ; réutilisé tel quel sur mobile (en tête de page). */
export function PeriodControls({ days, setDays }: { days: number; setDays: (n: number) => void }) {
  return (
    <>
      <CustomDatePicker />
      <Select size="small" value={days} onChange={(e) => setDays(Number(e.target.value))} inputProps={{ 'aria-label': 'Durée de la période' }}>
        <MenuItem value={1}>1 jour</MenuItem>
        <MenuItem value={7}>7 jours</MenuItem>
        <MenuItem value={14}>14 jours</MenuItem>
        <MenuItem value={29}>29 jours (≈ 1 jour lunaire)</MenuItem>
      </Select>
    </>
  );
}
