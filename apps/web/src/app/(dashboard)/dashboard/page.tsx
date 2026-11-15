'use client';
import { Alert, Grid, Skeleton, Typography } from '@mui/material';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { fmtEnergy, fmtHours, fmtPct, stepFor } from '@/lib/format';
import { SERIES } from '@/theme/theme';
import { useDashboard } from '@/components/dashboard/DashboardState';
import { StatCard } from '@/components/results/StatCard';
import { HighlightCard } from '@/components/results/HighlightCard';
import { PositionChart } from '@/components/results/PositionChart';
import { WindowsTimeline } from '@/components/results/WindowsTimeline';
import { DailyHoursChart } from '@/components/results/DailyHoursChart';
import { EnergyCard } from '@/components/results/EnergyCard';
import { ScoreCard } from '@/components/results/ScoreCard';
import { SiteInfoCard } from '@/components/results/SiteInfoCard';
import { SouthPoleMap } from '@/components/results/SouthPoleMap';
import { ValidationCard } from '@/components/results/ValidationCard';
import { FadeIn } from '@/components/motion/motion';
import { ErrorState, SlowNotice } from '@/components/results/LoadState';
import { useEffect } from 'react';
import { useT } from '@/i18n';

/** Sous-échantillonne une série pour les mini-courbes (le graphique principal garde tous les points). */
const thin = (v: number[], max = 60) => (v.length <= max ? v : v.filter((_, i) => i % Math.ceil(v.length / max) === 0));

const LEVEL_COLOR = { 'terrain-aware': 'success', simplified: 'warning', mock: 'error' } as const;

/** Vue d'ensemble d'un site : grille du template (cartes, graphiques, détails) avec les 4 visualisations du défi. */
export default function Overview() {
  const { siteId, setSiteId, date, days, selectedSite, sites } = useDashboard();
  const t = useT();
  const o = t.overview;
  const params = { date, days, stepMinutes: stepFor(days) };

  const res = useAsync(
    () => Promise.all([api.solar(siteId, params), api.earth(siteId, params), api.score(siteId, params)]),
    [siteId, date, days],
  );

  // Arrivée depuis la recherche (/dashboard#ancre) : on défile une fois les résultats affichés.
  const ready = Boolean(res.data);
  useEffect(() => {
    if (!ready || !window.location.hash) return;
    const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [ready]);

  if (sites.error) return <ErrorState title={o.catalogueDown} error={sites.error} />;
  if (res.error) return <ErrorState title={o.calcFailed} error={res.error} />;
  if (res.loading || !res.data) {
    return (
      <>
      <SlowNotice slow={res.slow} />
      <Grid container spacing={2} aria-busy="true" aria-label={o.loadingAria}>
        {[0, 1, 2, 3].map((i) => <Grid key={i} size={{ xs: 12, sm: 6, xl: 3 }}><Skeleton variant="rounded" height={160} /></Grid>)}
        {[0, 1].map((i) => <Grid key={i} size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={340} /></Grid>)}
      </Grid>
      </>
    );
  }

  const [solar, earth, score] = res.data;
  const period = solar.meta.period;
  const chip = { label: o.level[solar.meta.calculationLevel], color: LEVEL_COLOR[solar.meta.calculationLevel] };

  return (
    <FadeIn sx={{ '& [id]': { scrollMarginTop: { xs: 96, md: 24 } } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        {o.title(selectedSite?.name)}
      </Typography>

      {solar.meta.calculationLevel !== 'terrain-aware' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {o.flatWarning}
        </Alert>
      )}

      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <FadeIn index={0} sx={{ height: '100%' }}><StatCard title={o.sunTitle} value={fmtPct(solar.sunlitFraction)} chip={chip}
            interval={o.sunInterval(fmtHours(solar.sunlitHours), fmtHours(solar.longestDarknessHours))} color={SERIES.sun}
            help={o.sunHelp}
            data={thin(solar.sunPosition.map((p) => p.elevationDeg))} /></FadeIn>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <FadeIn index={1} sx={{ height: '100%' }}><StatCard title={o.earthTitle} value={fmtPct(earth.visibleFraction)} chip={chip}
            interval={o.earthInterval(fmtHours(earth.visibleHours), fmtHours(earth.longestVisibilityGapHours))} color={SERIES.earth}
            help={o.earthHelp}
            data={thin(earth.earthPosition.map((p) => p.elevationDeg))} /></FadeIn>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <FadeIn index={2} sx={{ height: '100%' }}><StatCard title={o.energyTitle} value={fmtEnergy(solar.energyPotential.indicativeEnergyWh)} chip={{ label: o.indicative, color: 'default' }}
            interval={o.energyInterval(String(solar.energyPotential.parameters.panelAreaM2), Math.round(solar.energyPotential.parameters.efficiency * 100))}
            color={SERIES.sun}
            help={o.energyHelp}
            data={thin(solar.sunPosition.map((p) => Math.max(0, p.elevationDeg)))} /></FadeIn>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><FadeIn index={3} sx={{ height: '100%' }}><HighlightCard /></FadeIn></Grid>

        <Grid id="soleil" size={{ xs: 12, lg: 6 }}>
          <PositionChart title={o.sunChart} subtitle={o.chartSubtitle} series={solar.sunPosition} color={SERIES.sun} meta={solar.meta} />
        </Grid>
        <Grid id="terre" size={{ xs: 12, lg: 6 }}>
          <PositionChart title={o.earthChart} subtitle={o.chartSubtitle} series={earth.earthPosition} color={SERIES.earth} meta={earth.meta} />
        </Grid>
      </Grid>

      <Typography component="h2" variant="h6" sx={{ mt: 2, mb: 2 }}>{o.details}</Typography>
      <Grid container spacing={2} columns={12}>
        {/* Frise pleine largeur : c'est elle qui a besoin d'espace (fenêtres sur toute la période). */}
        <Grid id="fenetres" size={12}>
          <WindowsTimeline
            period={period}
            meta={earth.meta}
            rows={[
              { label: o.sunVisible, color: SERIES.sun, windows: solar.sunWindows },
              { label: o.commRow, color: SERIES.earth, windows: earth.windows },
            ]}
          />
        </Grid>
        <Grid id="heures" size={{ xs: 12, lg: 7, xl: 8 }}>
          <DailyHoursChart sun={solar.sunWindows} earth={earth.windows} period={period} sunColor={SERIES.sun} earthColor={SERIES.earth} />
        </Grid>
        <Grid id="carte" size={{ xs: 12, lg: 5, xl: 4 }}>
          <SouthPoleMap sites={sites.data ?? []} selectedId={siteId} onSelect={setSiteId} size={520} />
        </Grid>
        <Grid id="energie" size={{ xs: 12, md: 6, xl: 3 }}><EnergyCard solar={solar} /></Grid>
        <Grid id="score" size={{ xs: 12, md: 6, xl: 3 }}><ScoreCard score={score} /></Grid>
        <Grid id="validation" size={{ xs: 12, md: 6, xl: 3 }}><ValidationCard siteId={siteId} /></Grid>
        {selectedSite && <Grid size={{ xs: 12, md: 6, xl: 3 }}><SiteInfoCard site={selectedSite} /></Grid>}
      </Grid>
    </FadeIn>
  );
}
