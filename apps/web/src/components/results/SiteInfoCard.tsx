'use client';
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { Site } from '@lunasite/shared-types';
import { fmtDeg, fmtNum } from '@/lib/format';
import { useT } from '@/i18n';

const STATUS_COLOR = { published: 'success', derived_from_dem: 'warning', approximate_to_verify: 'warning' } as const;

/** Fiche du site : coordonnées, provenance, relief. */
export function SiteInfoCard({ site }: { site: Site }) {
  const t = useT();
  const s = { label: t.siteInfo.status[site.coordinatesStatus], color: STATUS_COLOR[site.coordinatesStatus] };
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>{t.siteInfo.title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{site.description}</Typography>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
          <Chip size="small" color={s.color} variant="outlined" label={s.label} />
          {site.terrainType && <Chip size="small" variant="outlined" label={site.terrainType} />}
          <Chip size="small" variant="outlined" color={site.terrain.horizonMask ? 'success' : 'default'} label={site.terrain.horizonMask ? t.siteInfo.horizonTerrain : t.siteInfo.horizonFlat} />
        </Stack>
        <Stack sx={{ gap: 0.5, mt: 2 }}>
          <Typography variant="body2">{t.siteInfo.lat} : <b>{fmtDeg(site.latitude)}</b> · {t.siteInfo.lon} : <b>{fmtDeg(site.longitude)}</b> E</Typography>
          <Typography variant="body2">{t.siteInfo.alt} : <b>{fmtNum(site.elevationM, 'm')}</b></Typography>
          <Typography variant="body2">{t.siteInfo.slope} : <b>{fmtDeg(site.terrain.slopeDeg)}</b> · {t.siteInfo.relief} : <b>{fmtNum(site.terrain.localReliefM, 'm')}</b></Typography>
        </Stack>
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1.5 }}>
          {t.siteInfo.source(site.coordinatesSource)}
        </Typography>
      </CardContent>
    </Card>
  );
}
