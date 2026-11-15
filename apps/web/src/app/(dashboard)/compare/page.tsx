'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, IconButton, Skeleton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { BarChart } from '@mui/x-charts/BarChart';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import type { CompareScenario, Site } from '@lunasite/shared-types';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { fmtDateUTC, fmtDeg, fmtEnergy, fmtHours, fmtNum, fmtPct, fmtPeriod, stepFor } from '@/lib/format';
import { SERIES } from '@/theme/theme';
import { useDashboard } from '@/components/dashboard/DashboardState';
import { ErrorState, SlowNotice } from '@/components/results/LoadState';
import { useT, type Dict } from '@/i18n';

type Mode = 'sites' | 'dates';
const LEVEL_COLOR = { 'terrain-aware': 'success', simplified: 'warning', mock: 'error' } as const;
const SCORE_COLOR = 'hsl(150, 55%, 45%)';
const shortName = (name: string) => name.split(' — ')[0];
const addDays = (d: string, n: number) => dayjs(d).add(n, 'day').format('YYYY-MM-DD');
const scoreOf = (s: CompareScenario) => s.score.globalScore ?? s.score.partialScore;

/** Une ligne du tableau : valeur numérique (pour trouver le meilleur), sens du « meilleur », formatage. */
interface Row { key: keyof Dict['compare']['rows']; value: (s: CompareScenario) => number | null; better: 'high' | 'low' | null; fmt: (v: number | null, s: CompareScenario) => React.ReactNode }

function makeRows(t: Dict): Row[] {
  return [
    { key: 'level', value: () => null, better: null, fmt: (_v, s) => <Chip size="small" variant="outlined" color={LEVEL_COLOR[s.meta.calculationLevel]} label={t.meta.level[s.meta.calculationLevel]} /> },
    { key: 'sunlit', value: (s) => s.solar.sunlitFraction, better: 'high', fmt: (v) => fmtPct(v) },
    { key: 'sunlitHours', value: (s) => s.solar.sunlitHours, better: 'high', fmt: (v) => fmtHours(v) },
    { key: 'longestNight', value: (s) => s.solar.longestDarknessHours, better: 'low', fmt: (v) => fmtHours(v) },
    { key: 'maxSun', value: (s) => s.solar.maxSunElevationDeg, better: 'high', fmt: (v) => fmtDeg(v) },
    { key: 'earth', value: (s) => s.earth.visibleFraction, better: 'high', fmt: (v) => fmtPct(v) },
    { key: 'longestGap', value: (s) => s.earth.longestVisibilityGapHours, better: 'low', fmt: (v) => fmtHours(v) },
    { key: 'maxEarth', value: (s) => s.earth.maxEarthElevationDeg, better: 'high', fmt: (v) => fmtDeg(v) },
    { key: 'energy', value: (s) => s.solar.energyPotential.indicativeEnergyWh, better: 'high', fmt: (v) => fmtEnergy(v) },
    { key: 'peak', value: (s) => s.solar.energyPotential.peakPowerW, better: 'high', fmt: (v) => fmtNum(v, 'W') },
    {
      key: 'score', value: scoreOf, better: 'high',
      fmt: (v, s) => (
        <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center', justifyContent: 'flex-end' }}>
          <span>{v == null ? t.common.unavailable : Math.round(v)}</span>
          {s.score.globalScore == null && <Chip size="small" label={t.compare.partialTag} />}
        </Stack>
      ),
    },
    { key: 'terrain', value: (s) => s.score.terrainScore, better: 'high', fmt: (v) => (v == null ? t.common.unavailable : Math.round(v)) },
  ];
}

/** Indices des meilleurs scénarios pour une ligne (égalités incluses ; aucun si une seule valeur connue). */
function bestOf(row: Row, scenarios: CompareScenario[]): Set<number> {
  if (!row.better) return new Set();
  const vals = scenarios.map(row.value);
  const known = vals.filter((v): v is number => v != null);
  if (known.length < 2 || known.every((v) => Math.abs(v - known[0]) < 1e-9)) return new Set();
  const target = row.better === 'high' ? Math.max(...known) : Math.min(...known);
  return new Set(vals.flatMap((v, i) => (v != null && Math.abs(v - target) < 1e-9 ? [i] : [])));
}

/** Comparer : plusieurs sites sur la période du dashboard, ou un site sur plusieurs jours (POST /api/compare). */
export default function ComparePage() {
  const router = useRouter();
  const { sites, siteId, setSiteId, date, days, selectedSite } = useDashboard();
  const t = useT();
  const c = t.compare;
  const list = useMemo(() => sites.data ?? [], [sites.data]);

  const [mode, setMode] = useState<Mode>('sites');
  const [picked, setPicked] = useState<string[] | null>(null);
  const [dates, setDates] = useState<string[] | null>(null);

  // Valeurs par défaut : le site courant + deux sites polaires avec relief ; trois jours espacés d'une semaine.
  const defaultPicked = useMemo(() => {
    const ids = [siteId, 'shackleton', 'de-gerlache', 'haworth'].filter((id, i, a) => a.indexOf(id) === i && list.some((s) => s.id === id));
    return ids.slice(0, 3);
  }, [siteId, list]);
  const siteIds = picked ?? defaultPicked;
  const dayList = dates ?? [date, addDays(date, 7), addDays(date, 14)];
  const uniqueDays = [...new Set(dayList)];

  const endDate = addDays(date, days);
  const ready = mode === 'sites' ? siteIds.length >= 2 : uniqueDays.length >= 2;
  const res = useAsync(
    () => (!ready ? Promise.resolve(null)
      : mode === 'sites' ? api.compareSites(siteIds, date, endDate, stepFor(days))
      : api.compareDates(siteId, uniqueDays, 15)),
    [mode, ready, siteIds.join(','), date, days, siteId, uniqueDays.join(',')],
  );

  const scenarios = res.data?.scenarios ?? [];
  const labelOf = (s: CompareScenario) => (mode === 'sites' ? shortName(s.siteName) : fmtDateUTC(s.period.start));
  const rows = useMemo(() => makeRows(t), [t]);
  const anyFlat = scenarios.some((s) => s.meta.calculationLevel !== 'terrain-aware');
  const anyPartial = scenarios.some((s) => s.score.globalScore == null);

  return (
    <Box>
      <Typography component="h2" variant="h6" sx={{ mb: 0.5 }}>{c.title}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, maxWidth: 820 }}>{c.intro}</Typography>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'flex-start' } }}>
            <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_e, v: Mode | null) => v && setMode(v)} aria-label={c.modeAria} sx={{ flexShrink: 0 }}>
              <ToggleButton value="sites">{c.modeSites}</ToggleButton>
              <ToggleButton value="dates">{c.modeDates}</ToggleButton>
            </ToggleButtonGroup>

            {mode === 'sites' ? (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Autocomplete<Site, true>
                  multiple size="small" options={list} loading={sites.loading}
                  value={siteIds.flatMap((id) => list.filter((s) => s.id === id))}
                  onChange={(_e, v) => setPicked(v.slice(0, 4).map((s) => s.id))}
                  getOptionLabel={(s) => s.name}
                  getOptionDisabled={(s) => siteIds.length >= 4 && !siteIds.includes(s.id)}
                  groupBy={(s) => t.site.regions[s.region] ?? s.region}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderValue={(value, getItemProps) => value.map((s, index) => {
                    const { key, ...itemProps } = getItemProps({ index });
                    return <Chip key={key} size="small" label={shortName(s.name)} {...itemProps} />;
                  })}
                  renderInput={(params) => <TextField {...params} label={c.sitesLabel} />}
                />
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
                  {c.periodNote(fmtPeriod({ start: `${date}T00:00:00Z`, end: `${endDate}T00:00:00Z` }))}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {c.siteLabel} : <b>{selectedSite?.name ?? siteId}</b>
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>{c.datesLabel}</Typography>
                <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  {dayList.map((d, k) => (
                    <Stack key={k} direction="row" sx={{ alignItems: 'center' }}>
                      <DatePicker
                        value={dayjs(d)}
                        onChange={(v) => v?.isValid() && setDates(dayList.map((x, j) => (j === k ? v.format('YYYY-MM-DD') : x)))}
                        label={c.dateAria(k + 1)}
                        slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
                      />
                      {dayList.length > 2 && (
                        <Tooltip title={c.removeDate(k + 1)}>
                          <IconButton size="small" aria-label={c.removeDate(k + 1)} onClick={() => setDates(dayList.filter((_x, j) => j !== k))}>
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  ))}
                  {dayList.length < 4 && (
                    <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setDates([...dayList, addDays(dayList[dayList.length - 1], 7)])}>
                      {c.addDate}
                    </Button>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {!ready && <Alert severity="info" sx={{ mb: 2 }}>{mode === 'sites' ? c.needTwoSites : c.needTwoDates}</Alert>}
      <SlowNotice slow={res.slow} />
      {res.error && <ErrorState title={t.overview.calcFailed} error={res.error} />}

      {ready && !res.error && (
        <>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography component="h3" variant="subtitle2" sx={{ fontWeight: 600 }}>{c.chartTitle}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{c.chartSubtitle}</Typography>
              {res.loading || !scenarios.length ? (
                <Skeleton variant="rounded" height={280} sx={{ mt: 1 }} />
              ) : (
                <BarChart
                  height={300}
                  xAxis={[{ scaleType: 'band', data: scenarios.map(labelOf) }]}
                  yAxis={[{ min: 0, max: 100 }]}
                  series={[
                    { label: c.seriesSun, data: scenarios.map((s) => Math.round(s.solar.sunlitFraction * 100)), color: SERIES.sun },
                    { label: c.seriesEarth, data: scenarios.map((s) => Math.round(s.earth.visibleFraction * 100)), color: SERIES.earth },
                    { label: c.seriesScore, data: scenarios.map((s) => Math.round(scoreOf(s))), color: SCORE_COLOR },
                  ]}
                  margin={{ left: 0, right: 10, top: 20, bottom: 0 }}
                  grid={{ horizontal: true }}
                />
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ pb: 1 }}>
              <Typography component="h3" variant="subtitle2" sx={{ fontWeight: 600 }}>{c.tableTitle}</Typography>
            </CardContent>
            {res.loading || !scenarios.length ? (
              <Box sx={{ px: 2, pb: 2 }}><Skeleton variant="rounded" height={360} /></Box>
            ) : (
              <TableContainer>
                <Table size="small" aria-label={c.tableAria}>
                  <TableHead>
                    <TableRow>
                      <TableCell component="th" scope="col">{c.metric}</TableCell>
                      {scenarios.map((s, i) => (
                        <TableCell key={i} component="th" scope="col" align="right" sx={{ fontWeight: 600, minWidth: 130 }}>
                          {mode === 'sites' ? (
                            <Button size="small" variant="text" onClick={() => { setSiteId(s.siteId); router.push('/dashboard'); }}
                              title={c.openSite(shortName(s.siteName))} sx={{ fontWeight: 600, textAlign: 'right' }}>
                              {labelOf(s)}
                            </Button>
                          ) : labelOf(s)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const best = bestOf(row, scenarios);
                      return (
                        <TableRow key={row.key} hover>
                          <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>{c.rows[row.key]}</TableCell>
                          {scenarios.map((s, i) => (
                            <TableCell key={i} align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: best.has(i) ? 700 : 400, color: best.has(i) ? 'success.main' : undefined }}>
                              <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center', justifyContent: 'flex-end' }}>
                                {best.has(i) && <EmojiEventsRoundedIcon sx={{ fontSize: 16 }} titleAccess={c.best} />}
                                {row.fmt(row.value(s), s)}
                              </Stack>
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {(anyFlat || anyPartial) && scenarios.length > 0 && (
              <Stack sx={{ gap: 1, p: 2 }}>
                {anyFlat && <Alert severity="warning">{c.flatNote}</Alert>}
                {anyPartial && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{c.scoreNote}</Typography>}
              </Stack>
            )}
          </Card>
        </>
      )}
    </Box>
  );
}
