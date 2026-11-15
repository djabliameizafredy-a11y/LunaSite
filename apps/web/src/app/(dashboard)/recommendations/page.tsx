'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert, Box, Card, CardActionArea, CardContent, Chip, Grid, LinearProgress, Skeleton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import type { RecommendationEntry } from '@lunasite/shared-types';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { fmtPeriod, stepFor } from '@/lib/format';
import { useDashboard } from '@/components/dashboard/DashboardState';
import { ErrorState, SlowNotice } from '@/components/results/LoadState';
import { useT } from '@/i18n';

type Region = 'all' | 'south-pole';
const MEDALS = ['hsl(45, 90%, 52%)', 'hsl(210, 10%, 70%)', 'hsl(28, 60%, 50%)'];
const shortName = (name: string) => name.split(' — ')[0];
const round = (v: number | null) => (v == null ? null : Math.round(v));

/** Recommandations : classement des sites sur la période du dashboard (GET /api/recommendations). */
export default function RecommendationsPage() {
  const router = useRouter();
  const { setSiteId, date, days } = useDashboard();
  const t = useT();
  const r = t.reco;
  const [region, setRegion] = useState<Region>('south-pole');

  const res = useAsync(
    () => api.recommendations({ date, days, stepMinutes: stepFor(days), region: region === 'all' ? undefined : region }),
    [date, days, region],
  );
  const open = (e: RecommendationEntry) => { setSiteId(e.siteId); router.push('/dashboard'); };
  const data = res.data;
  const podium = data?.ranking.slice(0, 3) ?? [];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: 2 }}>
        <Box sx={{ maxWidth: 820 }}>
          <Typography component="h2" variant="h6" sx={{ mb: 0.5 }}>{r.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{r.intro}</Typography>
        </Box>
        <ToggleButtonGroup exclusive size="small" value={region} onChange={(_e, v: Region | null) => v && setRegion(v)} aria-label={r.regionAria} sx={{ flexShrink: 0 }}>
          <ToggleButton value="south-pole">{r.regionPole}</ToggleButton>
          <ToggleButton value="all">{r.regionAll}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <SlowNotice slow={res.slow} />
      {res.error && <ErrorState title={t.overview.calcFailed} error={res.error} />}

      {!res.error && (
        <>
          {data && (
            <Alert severity={data.rankingBasis === 'global' ? 'success' : 'info'} sx={{ mb: 2 }}>
              {data.rankingBasis === 'global' ? r.basisGlobal : r.basisPartial} {r.period(fmtPeriod(data.period))}
            </Alert>
          )}

          <Typography component="h3" variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{r.podium}</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {(res.loading || !data ? [0, 1, 2] : podium).map((e, k) => (
              <Grid key={typeof e === 'number' ? e : e.siteId} size={{ xs: 12, md: 4 }}>
                {typeof e === 'number' ? <Skeleton variant="rounded" height={150} /> : (
                  <Card variant="outlined" sx={{ height: '100%', borderColor: MEDALS[k], borderWidth: k === 0 ? 2 : 1 }}>
                    <CardActionArea onClick={() => open(e)} sx={{ height: '100%' }}>
                      <CardContent>
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
                          <EmojiEventsRoundedIcon sx={{ color: MEDALS[k] }} aria-hidden="true" />
                          <Typography variant="overline" sx={{ lineHeight: 1 }}>#{e.rank}</Typography>
                          {e.rankingBasis === 'partial' && <Chip size="small" label={t.compare.partialTag} sx={{ ml: 'auto' }} />}
                        </Stack>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap title={e.siteName}>{shortName(e.siteName)}</Typography>
                        <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.5, mt: 0.5 }}>
                          <Typography variant="h4" component="p" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Math.round(e.rankingScore)}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>/ 100</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {r.solar} {Math.round(e.score.solarScore)} · {r.comm} {Math.round(e.score.communicationScore)} · {r.terrain} {round(e.score.terrainScore) ?? t.common.unavailable}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                )}
              </Grid>
            ))}
          </Grid>

          <Card variant="outlined">
            {res.loading || !data ? (
              <Box sx={{ p: 2 }}><Skeleton variant="rounded" height={360} /></Box>
            ) : (
              <TableContainer>
                <Table size="small" aria-label={r.tableAria}>
                  <TableHead>
                    <TableRow>
                      <TableCell component="th" scope="col" sx={{ width: 64 }}>{r.rank}</TableCell>
                      <TableCell component="th" scope="col">{r.site}</TableCell>
                      <TableCell component="th" scope="col" sx={{ minWidth: 180 }}>{r.score}</TableCell>
                      <TableCell component="th" scope="col" align="right">{r.solar}</TableCell>
                      <TableCell component="th" scope="col" align="right">{r.comm}</TableCell>
                      <TableCell component="th" scope="col" align="right">{r.terrain}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.ranking.map((e) => (
                      <TableRow key={e.siteId} hover onClick={() => open(e)} sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{e.rank}</TableCell>
                        <TableCell>
                          <Box component="button" type="button" onClick={(ev: React.MouseEvent) => { ev.stopPropagation(); open(e); }}
                            title={r.open}
                            sx={{ all: 'unset', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', borderRadius: 0.5 } }}>
                            {e.siteName}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                            <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, e.rankingScore))} sx={{ flex: 1, height: 8, borderRadius: 4 }} aria-hidden="true" />
                            <Typography variant="body2" sx={{ fontWeight: 600, width: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(e.rankingScore)}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(e.score.solarScore)}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(e.score.communicationScore)}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{round(e.score.terrainScore) ?? t.common.unavailable}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Stack sx={{ p: 1.5, gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{r.rowHelp}</Typography>
              {data && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{r.apiNote} {data.criteria}</Typography>}
            </Stack>
          </Card>
        </>
      )}
    </Box>
  );
}
