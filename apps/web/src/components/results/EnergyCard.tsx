'use client';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import type { SolarResult } from '@lunasite/shared-types';
import { fmtEnergy, fmtNum } from '@/lib/format';
import { MetaChip } from './MetaChip';
import { useT } from '@/i18n';

/** Potentiel de production d'énergie (visualisation 3 du défi) avec ses hypothèses toujours visibles. */
export function EnergyCard({ solar }: { solar: SolarResult }) {
  const t = useT();
  const e = solar.energyPotential;
  const p = e.parameters;
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
            <BoltRoundedIcon color="primary" />
            <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>{t.energy.title}</Typography>
          </Stack>
          <MetaChip meta={solar.meta} />
        </Stack>
        <Typography variant="h3" component="p" sx={{ fontWeight: 700, mt: 2 }}>{fmtEnergy(e.indicativeEnergyWh)}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.energy.indicative}</Typography>
        <Stack direction="row" sx={{ gap: 3, mt: 2 }}>
          <div>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmtNum(e.peakPowerW, 'W')}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.energy.peak}</Typography>
          </div>
          <div>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmtNum(e.meanPowerW, 'W')}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.energy.mean}</Typography>
          </div>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>{t.energy.assumptionsTitle}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t.energy.assumptions(fmtNum(p.panelAreaM2, 'm²'), Math.round(p.efficiency * 100), fmtNum(p.panelTiltDeg, '°'), fmtNum(p.panelAzimuthDeg, '°'), fmtNum(p.solarConstantWm2, 'W/m²'))}
        </Typography>
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1 }}>
          {t.energy.formula}
        </Typography>
      </CardContent>
    </Card>
  );
}
