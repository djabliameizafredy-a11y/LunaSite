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

/** Sous-échantillonne une série pour les mini-courbes (le graphique principal garde tous les points). */
const thin = (v: number[], max = 60) => (v.length <= max ? v : v.filter((_, i) => i % Math.ceil(v.length / max) === 0));

const LEVEL_CHIP = {
  'terrain-aware': { label: 'relief LOLA', color: 'success' },
  simplified: { label: 'horizon plat', color: 'warning' },
  mock: { label: 'démo', color: 'error' },
} as const;

/** Vue d'ensemble d'un site : grille du template (cartes, graphiques, détails) avec les 4 visualisations du défi. */
export default function Overview() {
  const { siteId, setSiteId, date, days, selectedSite, sites } = useDashboard();
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

  if (sites.error) return <ErrorState title="Catalogue indisponible" error={sites.error} />;
  if (res.error) return <ErrorState title="Calcul impossible" error={res.error} />;
  if (res.loading || !res.data) {
    return (
      <>
      <SlowNotice slow={res.slow} />
      <Grid container spacing={2} aria-busy="true" aria-label="Chargement des résultats">
        {[0, 1, 2, 3].map((i) => <Grid key={i} size={{ xs: 12, sm: 6, xl: 3 }}><Skeleton variant="rounded" height={160} /></Grid>)}
        {[0, 1].map((i) => <Grid key={i} size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={340} /></Grid>)}
      </Grid>
      </>
    );
  }

  const [solar, earth, score] = res.data;
  const period = solar.meta.period;
  const chip = LEVEL_CHIP[solar.meta.calculationLevel];

  return (
    <FadeIn sx={{ '& [id]': { scrollMarginTop: { xs: 96, md: 24 } } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Vue d'ensemble{selectedSite ? ` — ${selectedSite.name}` : ''}
      </Typography>

      {solar.meta.calculationLevel !== 'terrain-aware' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Démonstrateur : <b>horizon plat</b> pour ce site (pas de relief chargé). Au pôle Sud, le relief local masque souvent le Soleil
          et la Terre : ensoleillement et fenêtres peuvent être <b>surestimés</b>.
        </Alert>
      )}

      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <FadeIn index={0} sx={{ height: '100%' }}><StatCard title="Soleil au-dessus de l'horizon" value={fmtPct(solar.sunlitFraction)} chip={chip}
            interval={`${fmtHours(solar.sunlitHours)} · plus longue nuit ${fmtHours(solar.longestDarknessHours)}`} color={SERIES.sun}
            help="Part du temps où le centre du Soleil est au-dessus de l'horizon du site."
            data={thin(solar.sunPosition.map((p) => p.elevationDeg))} /></FadeIn>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <FadeIn index={1} sx={{ height: '100%' }}><StatCard title="Terre visible" value={fmtPct(earth.visibleFraction)} chip={chip}
            interval={`${fmtHours(earth.visibleHours)} · plus longue coupure ${fmtHours(earth.longestVisibilityGapHours)}`} color={SERIES.earth}
            help="Part du temps où la Terre est au-dessus de l'horizon : communication directe géométriquement possible."
            data={thin(earth.earthPosition.map((p) => p.elevationDeg))} /></FadeIn>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <FadeIn index={2} sx={{ height: '100%' }}><StatCard title="Potentiel d'énergie" value={fmtEnergy(solar.energyPotential.indicativeEnergyWh)} chip={{ label: 'indicatif', color: 'default' }}
            interval={`panneau ${solar.energyPotential.parameters.panelAreaM2} m², rendement ${Math.round(solar.energyPotential.parameters.efficiency * 100)} %`}
            color={SERIES.sun}
            help="Énergie indicative d'un panneau illustratif sur la période (hypothèses détaillées plus bas)."
            data={thin(solar.sunPosition.map((p) => Math.max(0, p.elevationDeg)))} /></FadeIn>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><FadeIn index={3} sx={{ height: '100%' }}><HighlightCard /></FadeIn></Grid>

        <Grid id="soleil" size={{ xs: 12, lg: 6 }}>
          <PositionChart title="1 · Position du Soleil" subtitle="Élévation et azimut par rapport à l'horizon du site" series={solar.sunPosition} color={SERIES.sun} meta={solar.meta} />
        </Grid>
        <Grid id="terre" size={{ xs: 12, lg: 6 }}>
          <PositionChart title="2 · Position de la Terre" subtitle="Élévation et azimut par rapport à l'horizon du site" series={earth.earthPosition} color={SERIES.earth} meta={earth.meta} />
        </Grid>
      </Grid>

      <Typography component="h2" variant="h6" sx={{ mt: 2, mb: 2 }}>Détails</Typography>
      <Grid container spacing={2} columns={12}>
        {/* Frise pleine largeur : c'est elle qui a besoin d'espace (fenêtres sur toute la période). */}
        <Grid id="fenetres" size={12}>
          <WindowsTimeline
            period={period}
            meta={earth.meta}
            rows={[
              { label: 'Soleil visible', color: SERIES.sun, windows: solar.sunWindows },
              { label: '4 · Communication (Terre)', color: SERIES.earth, windows: earth.windows },
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
