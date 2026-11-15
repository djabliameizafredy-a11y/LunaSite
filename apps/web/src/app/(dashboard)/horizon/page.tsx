'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Alert, Box, Button, Card, CardContent, Chip, FormControlLabel, Grid, IconButton, MenuItem, Select, Skeleton, Slider, Stack, Switch, Tooltip, Typography,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { fmtDateTimeUTC, fmtDeg, stepFor } from '@/lib/format';
import { SERIES } from '@/theme/theme';
import { useDashboard } from '@/components/dashboard/DashboardState';
import type { LookState } from '@/components/horizon/HorizonScene';
import { ErrorState, SlowNotice } from '@/components/results/LoadState';
import { useT } from '@/i18n';

const HorizonScene = dynamic(() => import('@/components/horizon/HorizonScene'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%', bgcolor: '#0b0b0b' }} />,
});

/** Même interpolation que le moteur de l'API (maskFromUniform). */
function horizonAt(skyline: number[] | null, az: number): number {
  if (!skyline) return 0;
  const n = skyline.length;
  const x = ((((az % 360) + 360) % 360) / 360) * n;
  const i = Math.floor(x) % n;
  const f = x - Math.floor(x);
  return skyline[i] * (1 - f) + skyline[(i + 1) % n] * f;
}

const SPEEDS = [1, 3, 8];

function BodyCard({ name, icon, color, az, el, horizon, terrain }: {
  name: string; icon: React.ReactNode; color: string; az: number; el: number; horizon: number; terrain: boolean;
}) {
  const t = useT();
  const visible = el > horizon;
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{ color, display: 'flex' }} aria-hidden="true">{icon}</Box>
          <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600, mr: 'auto' }}>{name}</Typography>
          <Chip size="small" color={visible ? 'success' : 'default'} label={visible ? t.horizon.visible : terrain ? t.horizon.hiddenRelief : t.horizon.belowHorizon} />
        </Stack>
        <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.75,
          '& dt': { color: 'text.secondary', fontSize: '0.8125rem' }, '& dd': { m: 0, fontSize: '0.8125rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums', textAlign: 'right' } }}>
          <dt>{t.horizon.elevation}</dt><dd>{fmtDeg(el)}</dd>
          <dt>{t.horizon.azimuth}</dt><dd>{fmtDeg(az)}</dd>
          <dt>{terrain ? t.horizon.ridgeHere : t.horizon.flatHere}</dt><dd>{fmtDeg(horizon)}</dd>
          <dt>{t.horizon.margin}</dt><dd style={{ color: visible ? undefined : 'inherit' }}>{el - horizon >= 0 ? '+' : ''}{fmtDeg(el - horizon)}</dd>
        </Box>
      </CardContent>
    </Card>
  );
}

/** Vue horizon 3D : le ciel du site (Soleil, Terre) au-dessus de la vraie ligne de crête LOLA, sur la période choisie. */
export default function HorizonPage() {
  const { siteId, date, days, selectedSite } = useDashboard();
  const t = useT();
  const h = t.horizon;
  const params = { date, days, stepMinutes: stepFor(days) };
  const res = useAsync(
    () => Promise.all([api.solar(siteId, params), api.earth(siteId, params), api.horizon(siteId)]),
    [siteId, date, days],
  );

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [exaggeration, setExaggeration] = useState(6);
  const [showGrid, setShowGrid] = useState(true);
  const look = useRef<LookState>({ yaw: 180, pitch: 4, fov: 60 });

  const data = res.data;
  const n = data ? Math.min(data[0].sunPosition.length, data[1].earthPosition.length) : 0;
  const skyline = data?.[2].available ? data[2].elevationDeg : null;

  // Nouveau site / nouvelle période : on repart du début, caméra tournée vers le Soleil.
  useEffect(() => {
    setI(0);
    setPlaying(false);
    if (data) look.current.yaw = data[0].sunPosition[0]?.azimuthDeg ?? 180;
  }, [data]);

  // Lecture : avance d'un nombre de pas par image (requestAnimationFrame, s'arrête en fin de période).
  useEffect(() => {
    if (!playing || n === 0) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 60) {
        last = t;
        setI((k) => { const next = k + speed; if (next >= n - 1) { setPlaying(false); return n - 1; } return next; });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, n]);

  // Regard : glisser pour tourner, molette pour zoomer, flèches au clavier.
  const drag = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const k = look.current.fov / 600;
    look.current.yaw = (look.current.yaw - (e.clientX - drag.current.x) * k + 360) % 360;
    look.current.pitch = Math.max(-10, Math.min(80, look.current.pitch + (e.clientY - drag.current.y) * k));
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => { drag.current = null; };
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); look.current.fov = Math.max(10, Math.min(90, look.current.fov + Math.sign(e.deltaY) * 4)); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [data]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 3], ArrowDown: [0, -3] }[e.key];
    if (!step) return;
    e.preventDefault();
    look.current.yaw = (look.current.yaw + step[0] + 360) % 360;
    look.current.pitch = Math.max(-10, Math.min(80, look.current.pitch + step[1]));
  };
  const aim = useCallback((az: number, el: number) => { look.current.yaw = az; look.current.pitch = Math.max(-5, Math.min(60, el)); }, []);

  const frame = useMemo(() => {
    if (!data || n === 0) return null;
    const k = Math.min(i, n - 1);
    const s = data[0].sunPosition[k];
    const e = data[1].earthPosition[k];
    return {
      t: s.t,
      sun: { az: s.azimuthDeg, el: s.elevationDeg },
      earth: { az: e.azimuthDeg, el: e.elevationDeg },
    };
  }, [data, i, n]);

  if (res.error) return <ErrorState title={t.overview.calcFailed} error={res.error} />;

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Typography component="h2" variant="h6">{h.title(selectedSite?.name)}</Typography>
        {data && (skyline
          ? <Chip size="small" color="success" label={h.realRidge} />
          : <Chip size="small" color="warning" label={h.flatChip} />)}
      </Stack>

      <SlowNotice slow={res.slow} />
      {data && !skyline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {h.flatWarning}
        </Alert>
      )}

      <Card variant="outlined" sx={{ overflow: 'hidden', mb: 2 }}>
        <Box
          ref={viewport}
          tabIndex={0}
          role="application"
          aria-label={h.viewAria}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          sx={{ position: 'relative', height: { xs: 360, md: '58vh' }, minHeight: 320, bgcolor: '#000', cursor: 'grab', touchAction: 'none',
            '&:active': { cursor: 'grabbing' }, '&:focus-visible': { outline: '2px solid #fbbf24', outlineOffset: -2 } }}
        >
          {frame
            ? <HorizonScene sun={frame.sun} earth={frame.earth} skyline={skyline} exaggeration={exaggeration} look={look} showGrid={showGrid} cardinals={h.cardinals} />
            : <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%', bgcolor: '#0b0b0b' }} />}
          {frame && (
            <Box sx={{ position: 'absolute', left: 12, top: 12, px: 1.25, py: 0.75, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', pointerEvents: 'none' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtDateTimeUTC(frame.t)}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{h.enlarged(exaggeration)}</Typography>
            </Box>
          )}
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: { xs: 1.5, md: 2.5 }, alignItems: { md: 'center' }, px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
            <Tooltip title={playing ? h.pause : h.play}>
              <span>
                <IconButton onClick={() => { if (i >= n - 1) setI(0); setPlaying((p) => !p); }} disabled={!frame} aria-label={playing ? h.pause : h.play}>
                  {playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Slider size="small" min={0} max={Math.max(n - 1, 0)} value={Math.min(i, Math.max(n - 1, 0))} disabled={!frame}
              onChange={(_e, v) => { setPlaying(false); setI(v as number); }}
              aria-label={h.instant} getAriaValueText={() => (frame ? fmtDateTimeUTC(frame.t) : '')}
              valueLabelDisplay="off" sx={{ flex: 1 }} />
            <Select size="small" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} inputProps={{ 'aria-label': h.speed }}>
              {SPEEDS.map((v, k) => <MenuItem key={v} value={v}>{h.speeds[k]}</MenuItem>)}
            </Select>
          </Stack>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" startIcon={<WbSunnyRoundedIcon sx={{ color: SERIES.sun }} />} disabled={!frame}
              onClick={() => frame && aim(frame.sun.az, frame.sun.el)}>{h.aimSun}</Button>
            <Button size="small" variant="outlined" startIcon={<PublicRoundedIcon sx={{ color: SERIES.earth }} />} disabled={!frame}
              onClick={() => frame && aim(frame.earth.az, frame.earth.el)}>{h.aimEarth}</Button>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, width: 150 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{h.size(exaggeration)}</Typography>
              <Slider size="small" min={1} max={12} value={exaggeration} onChange={(_e, v) => setExaggeration(v as number)} aria-label={h.sizeAria} />
            </Stack>
            <FormControlLabel control={<Switch size="small" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />}
              label={<Typography variant="caption">{h.grid}</Typography>} sx={{ ml: 0.5 }} />
          </Stack>
        </Stack>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6, xl: 4 }}>
          {frame ? <BodyCard name={t.common.sun} icon={<WbSunnyRoundedIcon />} color={SERIES.sun} az={frame.sun.az} el={frame.sun.el}
            horizon={horizonAt(skyline, frame.sun.az)} terrain={Boolean(skyline)} /> : <Skeleton variant="rounded" height={170} />}
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 4 }}>
          {frame ? <BodyCard name={t.common.earth} icon={<PublicRoundedIcon />} color={SERIES.earth} az={frame.earth.az} el={frame.earth.el}
            horizon={horizonAt(skyline, frame.earth.az)} terrain={Boolean(skyline)} /> : <Skeleton variant="rounded" height={170} />}
        </Grid>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{h.howTitle}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {h.how(data?.[2].maxRangeKm ? h.upTo(data[2].maxRangeKm) : '')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
