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
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

type Item = { text: string; href: string; icon: React.ReactNode; soon?: boolean };

// Repris de MenuContent.tsx du template : liste principale en haut, liste secondaire en bas.
const mainListItems: Item[] = [
  { text: 'Accueil', href: '/', icon: <HomeRoundedIcon /> },
  { text: "Vue d'ensemble", href: '/dashboard', icon: <AnalyticsRoundedIcon /> },
  { text: 'Catalogue des sites', href: '/sites', icon: <TableRowsRoundedIcon /> },
  { text: 'Comparer', href: '/compare', icon: <CompareArrowsRoundedIcon />, soon: true },
  { text: 'Recommandations', href: '/recommendations', icon: <EmojiEventsRoundedIcon />, soon: true },
];

const secondaryListItems: Item[] = [{ text: 'Données et limites', href: '/limits', icon: <InfoRoundedIcon /> }];

export default function MenuContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
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
        <ListItemText primary={item.text} />
        {item.soon && <Chip size="small" label="bientôt" />}
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
