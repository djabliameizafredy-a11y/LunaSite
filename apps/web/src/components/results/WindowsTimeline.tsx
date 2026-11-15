'use client';
import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Collapse, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import type { ResultMeta, Window } from '@lunasite/shared-types';
import { fmtDateTimeUTC, fmtDayShort, fmtDeg, fmtHours, fmtPeriod } from '@/lib/format';
import { MetaChip } from './MetaChip';

interface Row { label: string; color: string; windows: Window[] }

/** Frise des fenêtres : Soleil visible et Terre visible (communication directe). Visualisation 4 du défi. */
export function WindowsTimeline({ rows, period, meta }: { rows: Row[]; period: { start: string; end: string }; meta: ResultMeta }) {
  const [showTable, setShowTable] = useState(false);
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
            <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>Fenêtres de visibilité et de communication directe</Typography>
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
                  title={`${fmtDateTimeUTC(w.start)}${w.truncatedStart ? ' (commence avant la période)' : ''} → ${fmtDateTimeUTC(w.end)}${w.truncatedEnd ? ' (continue après la période)' : ''} · ${fmtHours(w.durationHours)} · max ${fmtDeg(w.maxElevationDeg)}`}
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
          Visibilité <b>géométrique</b> de la Terre : elle ne garantit pas une liaison radio (antenne, station au sol et bilan de liaison non modélisés).
          Bord en pointillés : fenêtre tronquée par la période.
        </Typography>
        <Button size="small" onClick={() => setShowTable((v) => !v)} sx={{ mt: 1 }}>
          {showTable ? 'Masquer le tableau' : 'Voir en tableau'}
        </Button>
        <Collapse in={showTable} unmountOnExit>
          {rows.map((r) => (
            <Box key={r.label} sx={{ mt: 2 }}>
              <Typography variant="subtitle2">{r.label} — {r.windows.length} fenêtre(s)</Typography>
              {r.windows.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Aucune fenêtre sur la période (ce n'est pas une erreur).</Typography>
              ) : (
                <Table size="small">
                  <TableHead><TableRow><TableCell>Début (UTC)</TableCell><TableCell>Fin (UTC)</TableCell><TableCell align="right">Durée</TableCell><TableCell align="right">Élévation max</TableCell></TableRow></TableHead>
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
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>* limite tronquée par la période demandée.</Typography>
        </Collapse>
      </CardContent>
    </Card>
  );
}
