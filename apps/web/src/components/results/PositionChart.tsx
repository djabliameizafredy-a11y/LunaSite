'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import type { ResultMeta, TimeSeriesPoint } from '@lunasite/shared-types';
import { fmtDateTimeUTC, fmtDayShort } from '@/lib/format';
import { MetaChip } from './MetaChip';

interface Props {
  title: string;
  subtitle: string;
  series: TimeSeriesPoint[];
  color: string;
  meta: ResultMeta;
}

/** Position d'un astre par rapport à l'horizon : élévation (ou azimut) au fil du temps. Visualisations 1 et 2 du défi. */
export function PositionChart({ title, subtitle, series, color, meta }: Props) {
  const [mode, setMode] = useState<'elevation' | 'azimuth'>('elevation');
  const { x, y } = useMemo(() => ({
    x: series.map((p) => new Date(p.t)),
    y: series.map((p) => (mode === 'elevation' ? p.elevationDeg : p.azimuthDeg)),
  }), [series, mode]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
          <div>
            <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
          </div>
          <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_e, v) => v && setMode(v)} aria-label="grandeur affichée">
              <ToggleButton value="elevation">Élévation</ToggleButton>
              <ToggleButton value="azimuth">Azimut</ToggleButton>
            </ToggleButtonGroup>
            <MetaChip meta={meta} />
          </Stack>
        </Stack>
        <LineChart
          height={260}
          hideLegend
          grid={{ horizontal: true }}
          xAxis={[{ data: x, scaleType: 'time', valueFormatter: (d: Date, ctx) => (ctx.location === 'tick' ? fmtDayShort(d) : fmtDateTimeUTC(d)) }]}
          yAxis={[mode === 'elevation'
            ? { label: 'Élévation (°)' }
            : { label: 'Azimut (°)', min: 0, max: 360 }]}
          series={[{ data: y, color, showMark: false, curve: 'linear', label: mode === 'elevation' ? 'Élévation' : 'Azimut', valueFormatter: (v) => (v == null ? '' : `${v.toFixed(1)}°`) }]}
          margin={{ left: 8, right: 16, top: 16, bottom: 8 }}
        >
          {mode === 'elevation' && (
            <ChartsReferenceLine y={0} label="Horizon" labelAlign="start" lineStyle={{ strokeDasharray: '4 4' }} />
          )}
        </LineChart>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {mode === 'elevation'
            ? "Élévation : angle au-dessus de l'horizon local. Au-dessus de 0°, l'astre est visible (géométriquement)."
            : 'Azimut : direction autour du site, 0° = Nord, 90° = Est (convention affichée).'}
        </Typography>
      </CardContent>
    </Card>
  );
}
