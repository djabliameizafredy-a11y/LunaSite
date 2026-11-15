'use client';
import { useRouter } from 'next/navigation';
import { Alert, Card, Grid, Typography } from '@mui/material';
import { SouthPoleMap } from '@/components/results/SouthPoleMap';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import type { Site } from '@lunasite/shared-types';
import { useDashboard } from '@/components/dashboard/DashboardState';
import { UNAVAILABLE } from '@/lib/format';

const STATUS: Record<Site['coordinatesStatus'], string> = {
  published: 'Publiées',
  derived_from_dem: 'Dérivées du DEM LOLA',
  approximate_to_verify: 'À vérifier',
};

const REGION: Record<string, string> = {
  'south-pole': 'Pôle Sud', 'south-highlands': 'Hauts plateaux Sud', equatorial: 'Équatoriale', 'near-side': 'Face visible',
};

const columns: GridColDef<Site>[] = [
  { field: 'name', headerName: 'Site', flex: 2, minWidth: 220 },
  { field: 'region', headerName: 'Région', flex: 1, minWidth: 130, valueFormatter: (v: string) => REGION[v] ?? v },
  { field: 'latitude', headerName: 'Latitude (°)', type: 'number', flex: 1, minWidth: 110 },
  { field: 'longitude', headerName: 'Longitude (°E)', type: 'number', flex: 1, minWidth: 120 },
  {
    field: 'slope', headerName: 'Pente (°)', type: 'number', flex: 1, minWidth: 100,
    valueGetter: (_v, row) => row.terrain.slopeDeg,
    valueFormatter: (v: number | null) => (v == null ? UNAVAILABLE : v),
  },
  {
    field: 'relief', headerName: 'Relief local (m)', type: 'number', flex: 1, minWidth: 130,
    valueGetter: (_v, row) => row.terrain.localReliefM,
    valueFormatter: (v: number | null) => (v == null ? UNAVAILABLE : v),
  },
  {
    field: 'horizon', headerName: 'Horizon', flex: 1, minWidth: 120,
    valueGetter: (_v, row) => (row.terrain.horizonMask ? 'Relief LOLA' : 'Plat'),
  },
  { field: 'coordinatesStatus', headerName: 'Coordonnées', flex: 1, minWidth: 150, valueFormatter: (v: Site['coordinatesStatus']) => STATUS[v] },
];

/** Catalogue (table « Details » du template) : clic sur une ligne = ouvrir le site dans la vue d'ensemble. */
export default function SitesPage() {
  const router = useRouter();
  const { sites, siteId, setSiteId } = useDashboard();
  if (sites.error) return <Alert severity="error">Catalogue indisponible : {sites.error.message}</Alert>;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, xl: 8 }}>
        <Card sx={{ height: '100%' }}>
      <DataGrid
        rows={sites.data ?? []}
        columns={columns}
        loading={sites.loading}
        density="compact"
        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        disableRowSelectionOnClick
        onRowClick={(p) => { setSiteId(String(p.id)); router.push('/dashboard'); }}
        initialState={{ sorting: { sortModel: [{ field: 'latitude', sort: 'asc' }] } }}
        sx={{ border: 0, '& .MuiDataGrid-row': { cursor: 'pointer' } }}
      />
      <Typography variant="caption" sx={{ display: 'block', p: 1.5, color: 'text.secondary' }}>
        Coordonnées sélénographiques (Sud négatif, longitude Est positive). « indisponible » = valeur inconnue, jamais 0.
      </Typography>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, xl: 4 }}>
        <SouthPoleMap sites={sites.data ?? []} selectedId={siteId} onSelect={(id) => { setSiteId(id); router.push('/dashboard'); }} size={520} />
      </Grid>
    </Grid>
  );
}
