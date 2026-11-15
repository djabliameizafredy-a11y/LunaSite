'use client';
import { Alert, Box, Grid, Skeleton, Stack, Typography } from '@mui/material';
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

  if (sites.error) return <Alert severity="error">Catalogue indisponible : {sites.error.message}</Alert>;
  if (res.error) return <Alert severity="error">Calcul impossible : {res.error.message}</Alert>;
  if (res.loading || !res.data) {
    return (
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}><Skeleton variant="rounded" height={160} /></Grid>)}
        {[0, 1].map((i) => <Grid key={i} size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={340} /></Grid>)}
      </Grid>
    );
  }

  const [solar, earth, score] = res.data;
  const period = solar.meta.period;
  const chip = LEVEL_CHIP[solar.meta.calculationLevel];

  return (
    <Box>
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
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Soleil au-dessus de l'horizon" value={fmtPct(solar.sunlitFraction)} chip={chip}
            interval={`${fmtHours(solar.sunlitHours)} · plus longue nuit ${fmtHours(solar.longestDarknessHours)}`} color={SERIES.sun}
            help="Part du temps où le centre du Soleil est au-dessus de l'horizon du site."
            data={thin(solar.sunPosition.map((p) => p.elevationDeg))} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Terre visible" value={fmtPct(earth.visibleFraction)} chip={chip}
            interval={`${fmtHours(earth.visibleHours)} · plus longue coupure ${fmtHours(earth.longestVisibilityGapHours)}`} color={SERIES.earth}
            help="Part du temps où la Terre est au-dessus de l'horizon : communication directe géométriquement possible."
            data={thin(earth.earthPosition.map((p) => p.elevationDeg))} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Potentiel d'énergie" value={fmtEnergy(solar.energyPotential.indicativeEnergyWh)} chip={{ label: 'indicatif', color: 'default' }}
            interval={`panneau ${solar.energyPotential.parameters.panelAreaM2} m², rendement ${Math.round(solar.energyPotential.parameters.efficiency * 100)} %`}
            color={SERIES.sun}
            help="Énergie indicative d'un panneau illustratif sur la période (hypothèses détaillées plus bas)."
            data={thin(solar.sunPosition.map((p) => Math.max(0, p.elevationDeg)))} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><HighlightCard /></Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <PositionChart title="1 · Position du Soleil" subtitle="Élévation et azimut par rapport à l'horizon du site" series={solar.sunPosition} color={SERIES.sun} meta={solar.meta} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PositionChart title="2 · Position de la Terre" subtitle="Élévation et azimut par rapport à l'horizon du site" series={earth.earthPosition} color={SERIES.earth} meta={earth.meta} />
        </Grid>
      </Grid>

      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>Détails</Typography>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <Stack sx={{ gap: 2 }}>
            <WindowsTimeline
              period={period}
              meta={earth.meta}
              rows={[
                { label: 'Soleil visible', color: SERIES.sun, windows: solar.sunWindows },
                { label: '4 · Communication (Terre)', color: SERIES.earth, windows: earth.windows },
              ]}
            />
            <DailyHoursChart sun={solar.sunWindows} earth={earth.windows} period={period} sunColor={SERIES.sun} earthColor={SERIES.earth} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} sx={{ gap: 2 }}>
            <SouthPoleMap sites={sites.data ?? []} selectedId={siteId} onSelect={setSiteId} />
            <EnergyCard solar={solar} />
            <ValidationCard siteId={siteId} />
            <ScoreCard score={score} />
            {selectedSite && <SiteInfoCard site={selectedSite} />}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
