'use client';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import type { SolarResult } from '@lunasite/shared-types';
import { fmtEnergy, fmtNum } from '@/lib/format';
import { MetaChip } from './MetaChip';

/** Potentiel de production d'énergie (visualisation 3 du défi) avec ses hypothèses toujours visibles. */
export function EnergyCard({ solar }: { solar: SolarResult }) {
  const e = solar.energyPotential;
  const p = e.parameters;
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
            <BoltRoundedIcon color="primary" />
            <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>3 · Potentiel d'énergie</Typography>
          </Stack>
          <MetaChip meta={solar.meta} />
        </Stack>
        <Typography variant="h3" component="p" sx={{ fontWeight: 700, mt: 2 }}>{fmtEnergy(e.indicativeEnergyWh)}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>énergie indicative sur la période</Typography>
        <Stack direction="row" sx={{ gap: 3, mt: 2 }}>
          <div>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmtNum(e.peakPowerW, 'W')}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>puissance max</Typography>
          </div>
          <div>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmtNum(e.meanPowerW, 'W')}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>puissance moyenne</Typography>
          </div>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>Hypothèses (illustratives, pas une mission réelle)</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Panneau de {fmtNum(p.panelAreaM2, 'm²')}, rendement {Math.round(p.efficiency * 100)} %,
          inclinaison {fmtNum(p.panelTiltDeg, '°')}, azimut {fmtNum(p.panelAzimuthDeg, '°')},
          constante solaire {fmtNum(p.solarConstantWm2, 'W/m²')}.
        </Typography>
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1 }}>
          P = irradiance × cos(incidence) × surface × rendement, nulle sous l'horizon. Pas de pertes, de stockage ni de thermique modélisés.
        </Typography>
      </CardContent>
    </Card>
  );
}
