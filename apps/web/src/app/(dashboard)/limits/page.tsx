'use client';
import { Alert, Card, CardContent, Link, List, ListItem, ListItemText, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { fmtDateUTC, stepFor, todayUTC } from '@/lib/format';
import { fmtAngleDiff } from '@/components/results/ValidationCard';
import { useDashboard } from '@/components/dashboard/DashboardState';

const SOURCES = [
  { name: 'NASA PDS — LOLA (LRO), DEM polaire Sud 80 m', role: 'Relief, pentes et profils d’horizon', url: 'https://pds-geosciences.wustl.edu/missions/lro/lola.htm' },
  { name: 'NASA Moon Trek (WMTS)', role: 'Fonds de carte lunaires', url: 'https://trek.nasa.gov/moon/' },
  { name: 'JPL Horizons', role: 'Référence de validation des positions Soleil / Terre', url: 'https://ssd.jpl.nasa.gov/horizons/' },
  { name: 'LROC QuickMap', role: 'Image du pôle Sud (export géoréférencé) et exploration visuelle complémentaire', url: 'https://quickmap.lroc.im-ldi.com/' },
  { name: 'Agence spatiale canadienne — exploration lunaire', role: 'Contexte : programmes et missions lunaires', url: 'https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/' },
];

/** Tableau de validation : écarts entre notre moteur et JPL Horizons, site par site. */
function ValidationTable() {
  const v = useAsync(() => api.validation(), []);
  return (
    <Card>
      <CardContent>
        <Typography component="h2" variant="h6" gutterBottom>Validation contre JPL Horizons (NASA)</Typography>
        {v.error && <Alert severity="error">{v.error.message}</Alert>}
        {v.data && !v.data.available && <Alert severity="info">{v.data.reason}</Alert>}
        {v.data?.available && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Sur {v.data.summary.sites} sites, écart maximal : élévation ±{fmtAngleDiff(v.data.summary.maxAbsElevationDiffDeg)},
              azimut ±{fmtAngleDiff(v.data.summary.maxAbsAzimuthDiffDeg)}. Source : {v.data.source?.source}, {v.data.source?.ephemeris},
              importé le {v.data.source ? fmtDateUTC(v.data.source.fetchedAt) : ''} ({v.data.referenceSource === 'database' ? 'depuis PostgreSQL' : 'fichier embarqué'}).
            </Typography>
            <Table size="small" aria-label="Écarts LunaSite / JPL Horizons par site">
              <TableHead>
                <TableRow>
                  <TableCell>Site</TableCell>
                  <TableCell align="right">Soleil : élévation</TableCell>
                  <TableCell align="right">Soleil : azimut</TableCell>
                  <TableCell align="right">Terre : élévation</TableCell>
                  <TableCell align="right">Terre : azimut</TableCell>
                  <TableCell align="right">Instants</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {v.data.sites.map((s) => (
                  <TableRow key={s.siteId}>
                    <TableCell>{s.siteName}</TableCell>
                    <TableCell align="right">±{fmtAngleDiff(s.sun.maxAbsElevationDiffDeg)}</TableCell>
                    <TableCell align="right">±{fmtAngleDiff(s.sun.maxAbsAzimuthDiffDeg)}</TableCell>
                    <TableCell align="right">±{fmtAngleDiff(s.earth.maxAbsElevationDiffDeg)}</TableCell>
                    <TableCell align="right">±{fmtAngleDiff(s.earth.maxAbsAzimuthDiffDeg)}</TableCell>
                    <TableCell align="right">{s.sun.samples + s.earth.samples}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <List dense>
              {v.data.notes.map((n) => <ListItem key={n} disableGutters><ListItemText secondary={n} /></ListItem>)}
            </List>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Données et limites : d'où viennent les chiffres et ce qu'ils ne disent pas. */
export default function LimitsPage() {
  const { siteId } = useDashboard();
  const health = useAsync(() => api.health(), []);
  const solar = useAsync(() => api.solar(siteId, { date: todayUTC(), days: 1, stepMinutes: stepFor(1) }), [siteId]);

  return (
    <Stack sx={{ gap: 2 }}>
      {health.data && (
        <Alert severity={health.data.catalogueSource === 'database' ? 'success' : 'warning'}>
          Catalogue servi depuis : <b>{health.data.catalogueSource === 'database' ? 'PostgreSQL (Supabase)' : 'catalogue embarqué'}</b>
          {health.data.catalogueFallbackReason && ` — ${health.data.catalogueFallbackReason}`}
        </Alert>
      )}
      <ValidationTable />
      <Card>
        <CardContent>
          <Typography component="h2" variant="h6" gutterBottom>Sources de données</Typography>
          <List dense>
            {SOURCES.map((s) => (
              <ListItem key={s.name} disableGutters>
                <ListItemText primary={<Link href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</Link>} secondary={s.role} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography component="h2" variant="h6" gutterBottom>Hypothèses de calcul (renvoyées par l'API)</Typography>
          {solar.error && <Alert severity="error">{solar.error.message}</Alert>}
          {solar.data && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Méthode {solar.data.meta.methodVersion} · sources : {solar.data.meta.sources.join(' ; ')}
              </Typography>
              <List dense>
                {solar.data.meta.assumptions.map((a) => <ListItem key={a} disableGutters><ListItemText primary={a} /></ListItem>)}
              </List>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography component="h2" variant="h6" gutterBottom>Ce que LunaSite ne dit pas</Typography>
          <List dense>
            <ListItem disableGutters><ListItemText primary="Terre visible ≠ liaison radio garantie (antennes, stations au sol, bilan de liaison non modélisés)." /></ListItem>
            <ListItem disableGutters><ListItemText primary="Potentiel d’énergie indicatif ≠ production réelle (pas de pertes, de poussière, de stockage ni de thermique)." /></ListItem>
            <ListItem disableGutters><ListItemText primary="Sans relief chargé, l’horizon est plat : au pôle Sud, ensoleillement et fenêtres peuvent être surestimés." /></ListItem>
            <ListItem disableGutters><ListItemText primary="Le score de faisabilité repose sur une pondération choisie par l’équipe, pas sur un standard NASA." /></ListItem>
            <ListItem disableGutters><ListItemText primary="Outil pédagogique : aucune recommandation opérationnelle d’atterrissage." /></ListItem>
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}
