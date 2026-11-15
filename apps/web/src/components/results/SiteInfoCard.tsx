'use client';
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { Site } from '@lunasite/shared-types';
import { fmtDeg, fmtNum } from '@/lib/format';

const STATUS = {
  published: { label: 'Coordonnées publiées', color: 'success' },
  derived_from_dem: { label: 'Point dérivé du DEM LOLA (non officiel)', color: 'warning' },
  approximate_to_verify: { label: 'Approximatif, à vérifier', color: 'warning' },
} as const;

/** Fiche du site : coordonnées, provenance, relief. */
export function SiteInfoCard({ site }: { site: Site }) {
  const s = STATUS[site.coordinatesStatus];
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>Le site</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{site.description}</Typography>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
          <Chip size="small" color={s.color} variant="outlined" label={s.label} />
          {site.terrainType && <Chip size="small" variant="outlined" label={site.terrainType} />}
          <Chip size="small" variant="outlined" color={site.terrain.horizonMask ? 'success' : 'default'} label={site.terrain.horizonMask ? 'Horizon issu du relief' : 'Horizon plat (pas de relief)'} />
        </Stack>
        <Stack sx={{ gap: 0.5, mt: 2 }}>
          <Typography variant="body2">Latitude : <b>{fmtDeg(site.latitude)}</b> · Longitude : <b>{fmtDeg(site.longitude)}</b> E</Typography>
          <Typography variant="body2">Altitude : <b>{fmtNum(site.elevationM, 'm')}</b></Typography>
          <Typography variant="body2">Pente moyenne : <b>{fmtDeg(site.terrain.slopeDeg)}</b> · Relief local : <b>{fmtNum(site.terrain.localReliefM, 'm')}</b></Typography>
        </Stack>
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1.5 }}>
          Source : {site.coordinatesSource}. Repère sélénographique, longitude Est positive.
        </Typography>
      </CardContent>
    </Card>
  );
}
