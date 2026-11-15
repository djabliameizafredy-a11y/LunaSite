'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import LandscapeRoundedIcon from '@mui/icons-material/LandscapeRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import { useT } from '@/i18n';

type Item = { key: 'home' | 'overview' | 'horizon' | 'catalogue' | 'compare' | 'recommendations' | 'about' | 'limits'; href: string; icon: React.ReactNode; soon?: boolean };

// Repris de MenuContent.tsx du template : liste principale en haut, liste secondaire en bas.
const mainListItems: Item[] = [
  { key: 'home', href: '/', icon: <HomeRoundedIcon /> },
  { key: 'overview', href: '/dashboard', icon: <AnalyticsRoundedIcon /> },
  { key: 'horizon', href: '/horizon', icon: <LandscapeRoundedIcon /> },
  { key: 'catalogue', href: '/sites', icon: <TableRowsRoundedIcon /> },
  { key: 'compare', href: '/compare', icon: <CompareArrowsRoundedIcon />, soon: true },
  { key: 'recommendations', href: '/recommendations', icon: <EmojiEventsRoundedIcon />, soon: true },
];

const secondaryListItems: Item[] = [
  { key: 'about', href: '/about', icon: <HelpOutlineRoundedIcon /> },
  { key: 'limits', href: '/limits', icon: <InfoRoundedIcon /> },
];

export default function MenuContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useT();
  const render = (item: Item) => (
    <ListItem key={item.href} disablePadding sx={{ display: 'block' }}>
      <ListItemButton
        component={item.soon ? 'div' : Link}
        href={item.soon ? undefined : item.href}
        selected={pathname === item.href}
        disabled={item.soon}
        onClick={item.soon ? undefined : onNavigate}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={t.nav[item.key]} />
        {item.soon && <Chip size="small" label={t.nav.soon} />}
      </ListItemButton>
    </ListItem>
  );

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>{mainListItems.map(render)}</List>
      <List dense>{secondaryListItems.map(render)}</List>
    </Stack>
  );
}
