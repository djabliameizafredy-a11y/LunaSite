'use client';
import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Collapse, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import type { ResultMeta, Window } from '@lunasite/shared-types';
import { fmtDateTimeUTC, fmtDayShort, fmtDeg, fmtHours, fmtPeriod } from '@/lib/format';
import { MetaChip } from './MetaChip';
import { useT } from '@/i18n';

interface Row { label: string; color: string; windows: Window[] }

/** Frise des fenêtres : Soleil visible et Terre visible (communication directe). Visualisation 4 du défi. */
export function WindowsTimeline({ rows, period, meta }: { rows: Row[]; period: { start: string; end: string }; meta: ResultMeta }) {
  const [showTable, setShowTable] = useState(false);
  const t = useT();
  const t0 = Date.parse(period.start);
  const span = Date.parse(period.end) - t0;
  const pct = (iso: string) => Math.min(100, Math.max(0, ((Date.parse(iso) - t0) / span) * 100));
  const days = Math.round(span / 86_400_000);
  const ticks = Array.from({ length: Math.min(days, 15) + 1 }, (_, i) => new Date(t0 + (span * i) / Math.min(days, 15)));

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <div>
            <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>{t.timeline.title}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{fmtPeriod(period)}</Typography>
          </div>
          <MetaChip meta={meta} />
        </Stack>

        {rows.map((r) => (
          <Stack key={r.label} direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Typography variant="body2" sx={{ width: 150, flexShrink: 0 }}>{r.label}</Typography>
            <Box sx={{ position: 'relative', flexGrow: 1, height: 22, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
              {r.windows.map((w) => (
                <Tooltip
                  key={w.start}
                  arrow
                  title={`${fmtDateTimeUTC(w.start)}${w.truncatedStart ? t.timeline.startsBefore : ''} → ${fmtDateTimeUTC(w.end)}${w.truncatedEnd ? t.timeline.endsAfter : ''} · ${fmtHours(w.durationHours)} · max ${fmtDeg(w.maxElevationDeg)}`}
                >
                  <Box
                    sx={{
                      position: 'absolute', top: 0, bottom: 0, left: `${pct(w.start)}%`,
                      width: `max(2px, ${pct(w.end) - pct(w.start)}%)`, bgcolor: r.color, opacity: 0.85,
                      borderLeft: w.truncatedStart ? '2px dashed #fff' : undefined,
                      borderRight: w.truncatedEnd ? '2px dashed #fff' : undefined,
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Stack>
        ))}
        <Box sx={{ position: 'relative', height: 18, ml: '162px' }}>
          {ticks.map((d) => (
            <Typography key={d.getTime()} variant="caption" sx={{ position: 'absolute', left: `${((d.getTime() - t0) / span) * 100}%`, transform: 'translateX(-50%)', color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {fmtDayShort(d)}
            </Typography>
          ))}
        </Box>

        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1 }}>
          {t.timeline.note}
        </Typography>
        <Button size="small" onClick={() => setShowTable((v) => !v)} sx={{ mt: 1 }}>
          {showTable ? t.timeline.hideTable : t.timeline.showTable}
        </Button>
        <Collapse in={showTable} unmountOnExit>
          {rows.map((r) => (
            <Box key={r.label} sx={{ mt: 2 }}>
              <Typography variant="subtitle2">{t.timeline.windowsCount(r.label, r.windows.length)}</Typography>
              {r.windows.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t.timeline.none}</Typography>
              ) : (
                <Table size="small">
                  <TableHead><TableRow><TableCell>{t.timeline.start}</TableCell><TableCell>{t.timeline.end}</TableCell><TableCell align="right">{t.timeline.duration}</TableCell><TableCell align="right">{t.timeline.maxEl}</TableCell></TableRow></TableHead>
                  <TableBody>
                    {r.windows.map((w) => (
                      <TableRow key={w.start}>
                        <TableCell>{fmtDateTimeUTC(w.start)}{w.truncatedStart && ' *'}</TableCell>
                        <TableCell>{fmtDateTimeUTC(w.end)}{w.truncatedEnd && ' *'}</TableCell>
                        <TableCell align="right">{fmtHours(w.durationHours)}</TableCell>
                        <TableCell align="right">{fmtDeg(w.maxElevationDeg)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          ))}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.timeline.truncated}</Typography>
        </Collapse>
      </CardContent>
    </Card>
  );
}
