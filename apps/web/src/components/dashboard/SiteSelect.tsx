'use client';
import MuiAvatar from '@mui/material/Avatar';
import MuiListItemAvatar from '@mui/material/ListItemAvatar';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Select, { selectClasses } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded';
import type { Site } from '@lunasite/shared-types';
import { useDashboard } from './DashboardState';

// Repris de SelectContent.tsx du template (Avatar, ListItemAvatar, styles du Select), alimenté par le catalogue.
const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 28,
  height: 28,
  backgroundColor: (theme.vars || theme).palette.background.paper,
  color: (theme.vars || theme).palette.text.secondary,
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
}));

const ListItemAvatar = styled(MuiListItemAvatar)({ minWidth: 0, marginRight: 12 });

const REGION_LABEL: Record<string, string> = {
  'south-pole': 'Pôle Sud', 'south-highlands': 'Hauts plateaux Sud', equatorial: 'Équatoriale', 'near-side': 'Face visible',
};

export function SiteSelect() {
  const { sites, siteId, setSiteId } = useDashboard();
  const list = sites.data ?? [];
  const groups = list.reduce<Record<string, Site[]>>((acc, s) => ((acc[s.region] ??= []).push(s), acc), {});

  const row = (s: Site) => [
    <ListItemAvatar key="a">
      <Avatar alt={s.name}>
        {s.region === 'south-pole' ? <PlaceRoundedIcon sx={{ fontSize: '1rem' }} /> : <HistoryEduRoundedIcon sx={{ fontSize: '1rem' }} />}
      </Avatar>
    </ListItemAvatar>,
    <ListItemText
      key="t"
      primary={s.name}
      secondary={`${s.latitude.toFixed(2)}°, ${s.longitude.toFixed(2)}°E`}
      slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }}
      sx={{ minWidth: 0 }}
    />,
  ];

  return (
    <Select
      labelId="site-select"
      id="site-simple-select"
      value={list.some((s) => s.id === siteId) ? siteId : ''}
      onChange={(e) => setSiteId(String(e.target.value))}
      displayEmpty
      inputProps={{ 'aria-label': 'Choisir un site' }}
      fullWidth
      renderValue={(id) => { const s = list.find((x) => x.id === id); return s ? row(s) : 'Chargement des sites…'; }}
      sx={{
        maxHeight: 56,
        width: 215,
        '&.MuiList-root': { p: '8px' },
        [`& .${selectClasses.select}`]: { display: 'flex', alignItems: 'center', gap: '2px', pl: 1 },
      }}
      MenuProps={{ slotProps: { paper: { sx: { maxHeight: 440 } } } }}
    >
      {Object.entries(groups).flatMap(([region, items], i) => [
        <ListSubheader key={`h-${region}`} sx={i === 0 ? { pt: 0 } : undefined}>{REGION_LABEL[region] ?? region}</ListSubheader>,
        ...items.map((s) => <MenuItem key={s.id} value={s.id}>{row(s)}</MenuItem>),
      ])}
    </Select>
  );
}
