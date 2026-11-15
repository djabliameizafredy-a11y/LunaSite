'use client';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { fmtDateTimeUTC } from '@/lib/format';
import { useDashboard } from '@/components/dashboard/DashboardState';

const MoonGlobe = dynamic(() => import('./MoonGlobe'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%', bgcolor: '#0b0b0b' }} />,
});

/** Globe 3D : sites du catalogue + terminateur jour/nuit réel à la date choisie (00:00 UTC). */
export function GlobeCard() {
  const { sites, siteId, setSiteId, date, selectedSite } = useDashboard();
  const t = `${date}T00:00:00Z`;
  const geo = useAsync(() => api.moonGeometry(t), [t]);
  return (
    <Card variant="outlined" sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600 }}>Globe lunaire</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Glisser pour tourner, molette pour zoomer · cliquez sur un site pour le choisir
        </Typography>
      </CardContent>
      <Box sx={{ position: 'relative', flex: 1, minHeight: { xs: 340, md: 460 }, bgcolor: '#000' }}
        role="img" aria-label="Globe 3D de la Lune avec les sites du catalogue et la limite jour/nuit">
        <MoonGlobe sites={sites.data ?? []} selectedId={siteId} onSelect={setSiteId} geometry={geo.data}
          labels={{ sun: 'Soleil au zénith', earth: 'Terre au zénith' }} />
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ px: 2, py: 1.5, gap: 1.5, alignItems: { sm: 'center' }, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', mr: 'auto', lineHeight: 1.5 }}>
          Éclairage réel au {fmtDateTimeUTC(t)} (point subsolaire calculé) · texture du sol illustrative, pas une mosaïque NASA.
        </Typography>
        {selectedSite && (
          <Button component={NextLink} href="/dashboard" size="small" variant="outlined" endIcon={<ChevronRightRoundedIcon />} sx={{ flexShrink: 0 }}>
            Ouvrir {selectedSite.name.split(' — ')[0]}
          </Button>
        )}
      </Stack>
    </Card>
  );
}
