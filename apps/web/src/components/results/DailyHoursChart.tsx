'use client';
import { useMemo } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { Window } from '@lunasite/shared-types';
import { fmtDayShort } from '@/lib/format';

/** Heures de fenêtre par jour UTC : simple agrégation des fenêtres renvoyées par l'API (aucun calcul physique ici). */
function hoursPerDay(windows: Window[], start: string, end: string) {
  const t0 = Date.parse(start), t1 = Date.parse(end), DAY = 86_400_000;
  const out: number[] = [];
  for (let d = t0; d < t1; d += DAY) {
    const dEnd = Math.min(d + DAY, t1);
    const ms = windows.reduce((acc, w) => acc + Math.max(0, Math.min(Date.parse(w.end), dEnd) - Math.max(Date.parse(w.start), d)), 0);
    out.push(Math.round((ms / 3_600_000) * 10) / 10);
  }
  return out;
}

export function DailyHoursChart({ sun, earth, period, sunColor, earthColor }: {
  sun: Window[]; earth: Window[]; period: { start: string; end: string }; sunColor: string; earthColor: string;
}) {
  const data = useMemo(() => {
    const s = hoursPerDay(sun, period.start, period.end);
    const e = hoursPerDay(earth, period.start, period.end);
    const labels = s.map((_, i) => fmtDayShort(new Date(Date.parse(period.start) + i * 86_400_000)));
    return { s, e, labels };
  }, [sun, earth, period]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>Heures par jour</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Soleil au-dessus de l'horizon et Terre visible, par jour UTC (sur 24 h)</Typography>
        <BarChart
          height={260}
          grid={{ horizontal: true }}
          xAxis={[{ data: data.labels, scaleType: 'band' }]}
          yAxis={[{ min: 0, max: 24, label: 'heures' }]}
          series={[
            { data: data.s, label: 'Soleil', color: sunColor, valueFormatter: (v) => `${v} h` },
            { data: data.e, label: 'Terre', color: earthColor, valueFormatter: (v) => `${v} h` },
          ]}
          margin={{ left: 8, right: 8, top: 16, bottom: 8 }}
        />
      </CardContent>
    </Card>
  );
}
