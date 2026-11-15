'use client';
import { useRouter } from 'next/navigation';
import { Alert, Card, Grid, Typography } from '@mui/material';
import { SouthPoleMap } from '@/components/results/SouthPoleMap';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { enUS, frFR } from '@mui/x-data-grid/locales';
import type { Site } from '@lunasite/shared-types';
import { useDashboard } from '@/components/dashboard/DashboardState';
import { UNAVAILABLE } from '@/lib/format';
import { ErrorState } from '@/components/results/LoadState';
import { GlobeCard } from '@/components/globe/GlobeCard';
import { useI18n, type Dict } from '@/i18n';
import { useMemo } from 'react';

const makeColumns = (t: Dict): GridColDef<Site>[] => [
  { field: 'name', headerName: t.sites.cols.name, flex: 2, minWidth: 220 },
  { field: 'region', headerName: t.sites.cols.region, flex: 1, minWidth: 130, valueFormatter: (v: string) => t.site.regions[v] ?? v },
  { field: 'latitude', headerName: t.sites.cols.lat, type: 'number', flex: 1, minWidth: 110 },
  { field: 'longitude', headerName: t.sites.cols.lon, type: 'number', flex: 1, minWidth: 120 },
  {
    field: 'slope', headerName: t.sites.cols.slope, type: 'number', flex: 1, minWidth: 100,
    valueGetter: (_v, row) => row.terrain.slopeDeg,
    valueFormatter: (v: number | null) => (v == null ? t.common.unavailable : v),
  },
  {
    field: 'relief', headerName: t.sites.cols.relief, type: 'number', flex: 1, minWidth: 130,
    valueGetter: (_v, row) => row.terrain.localReliefM,
    valueFormatter: (v: number | null) => (v == null ? t.common.unavailable : v),
  },
  {
    field: 'horizon', headerName: t.sites.cols.horizon, flex: 1, minWidth: 120,
    valueGetter: (_v, row) => (row.terrain.horizonMask ? t.sites.horizonLola : t.sites.horizonFlat),
  },
  { field: 'coordinatesStatus', headerName: t.sites.cols.coords, flex: 1, minWidth: 150, valueFormatter: (v: Site['coordinatesStatus']) => t.sites.status[v] },
];

/** Catalogue (table « Details » du template) : clic sur une ligne = ouvrir le site dans la vue d'ensemble. */
export default function SitesPage() {
  const router = useRouter();
  const { sites, siteId, setSiteId } = useDashboard();
  const { t, locale } = useI18n();
  const columns = useMemo(() => makeColumns(t), [t]);
  if (sites.error) return <ErrorState title={t.overview.catalogueDown} error={sites.error} />;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 7 }}><GlobeCard /></Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <SouthPoleMap sites={sites.data ?? []} selectedId={siteId} onSelect={(id) => { setSiteId(id); router.push('/dashboard'); }} size={560} />
      </Grid>
      <Grid size={12}>
        <Card>
          <DataGrid
            rows={sites.data ?? []}
            columns={columns}
            loading={sites.loading}
            density="compact"
            localeText={(locale === 'fr' ? frFR : enUS).components.MuiDataGrid.defaultProps.localeText}
            disableRowSelectionOnClick
            onRowClick={(p) => { setSiteId(String(p.id)); router.push('/dashboard'); }}
            initialState={{ sorting: { sortModel: [{ field: 'latitude', sort: 'asc' }] } }}
            sx={{ border: 0, '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          />
          <Typography variant="caption" sx={{ display: 'block', p: 1.5, color: 'text.secondary' }}>
            {t.sites.note}
          </Typography>
        </Card>
      </Grid>
    </Grid>
  );
}
