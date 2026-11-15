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
import { SearchCommand } from './SearchCommand';
import { useT } from '@/i18n';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';

// Repris de NavbarBreadcrumbs.tsx du template.
const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: { color: (theme.vars || theme).palette.action.disabled, margin: 1 },
  [`& .${breadcrumbsClasses.ol}`]: { alignItems: 'center' },
}));

const TITLE_KEYS = { '/dashboard': 'overview', '/sites': 'catalogue', '/limits': 'limits', '/about': 'about', '/horizon': 'horizon', '/compare': 'compare', '/recommendations': 'recommendations' } as const;

// Repris de Header.tsx du template : fil d'Ariane à gauche ; à droite, période (au lieu de Search + notifications) et thème.
export default function Header() {
  const pathname = usePathname();
  const { days, setDays } = useDashboard();
  const t = useT();
  const titleKey = TITLE_KEYS[pathname as keyof typeof TITLE_KEYS];

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
      <StyledBreadcrumbs aria-label={t.nav.breadcrumb} separator={<NavigateNextRoundedIcon fontSize="small" />}>
        <Typography variant="body1">LunaSite</Typography>
        <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>{titleKey ? t.nav[titleKey] : ''}</Typography>
      </StyledBreadcrumbs>
      <Stack direction="row" sx={{ gap: 1 }}>
        <SearchCommand />
        <LanguageSwitch />
        {/* La vue Horizon 3D est en direct : la période n'y a pas d'effet. */}
        {pathname !== '/horizon' && <PeriodControls days={days} setDays={setDays} />}
        <ColorModeIconDropdown />
      </Stack>
    </Stack>
  );
}

/** Jour de début + durée ; réutilisé tel quel sur mobile (en tête de page). */
export function PeriodControls({ days, setDays }: { days: number; setDays: (n: number) => void }) {
  const t = useT();
  return (
    <>
      <CustomDatePicker />
      <Select size="small" value={days} onChange={(e) => setDays(Number(e.target.value))} inputProps={{ 'aria-label': t.period.duration }}>
        <MenuItem value={1}>{t.period.days(1)}</MenuItem>
        <MenuItem value={7}>{t.period.days(7)}</MenuItem>
        <MenuItem value={14}>{t.period.days(14)}</MenuItem>
        <MenuItem value={29}>{t.period.lunarDay}</MenuItem>
      </Select>
    </>
  );
}
