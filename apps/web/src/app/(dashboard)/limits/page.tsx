'use client';
import { Alert, Card, CardContent, Link, List, ListItem, ListItemText, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { fmtDateUTC, stepFor, todayUTC } from '@/lib/format';
import { fmtAngleDiff } from '@/components/results/ValidationCard';
import { useDashboard } from '@/components/dashboard/DashboardState';
import { useT } from '@/i18n';

const SOURCE_URLS = [
  'https://pds-geosciences.wustl.edu/missions/lro/lola.htm',
  'https://trek.nasa.gov/moon/',
  'https://ssd.jpl.nasa.gov/horizons/',
  'https://quickmap.lroc.im-ldi.com/',
  'https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/',
];

/** Tableau de validation : écarts entre notre moteur et JPL Horizons, site par site. */
function ValidationTable() {
  const t = useT();
  const l = t.limits;
  const v = useAsync(() => api.validation(), []);
  return (
    <Card>
      <CardContent>
        <Typography component="h2" variant="h6" gutterBottom>{l.validationTitle}</Typography>
        {v.error && <Alert severity="error">{v.error.message}</Alert>}
        {v.data && !v.data.available && <Alert severity="info">{v.data.reason ?? t.validation.notImported}</Alert>}
        {v.data?.available && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              {l.validationSummary(v.data.summary.sites, fmtAngleDiff(v.data.summary.maxAbsElevationDiffDeg), fmtAngleDiff(v.data.summary.maxAbsAzimuthDiffDeg))}{' '}
              {l.validationSource(v.data.source?.source ?? '', v.data.source?.ephemeris ?? '', v.data.source ? fmtDateUTC(v.data.source.fetchedAt) : '',
                v.data.referenceSource === 'database' ? l.fromDbShort : l.fromFile)}
            </Typography>
            <Table size="small" aria-label={l.tableAria}>
              <TableHead>
                <TableRow>
                  {l.cols.map((c, i) => <TableCell key={c} align={i === 0 ? 'left' : 'right'}>{c}</TableCell>)}
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
  const t = useT();
  const l = t.limits;
  const { siteId } = useDashboard();
  const health = useAsync(() => api.health(), []);
  const solar = useAsync(() => api.solar(siteId, { date: todayUTC(), days: 1, stepMinutes: stepFor(1) }), [siteId]);

  return (
    <Stack sx={{ gap: 2 }}>
      {health.data && (
        <Alert severity={health.data.catalogueSource === 'database' ? 'success' : 'warning'}>
          {l.servedFrom} <b>{health.data.catalogueSource === 'database' ? t.sidebar.fromDb : t.sidebar.embedded}</b>
          {health.data.catalogueFallbackReason && ` — ${health.data.catalogueFallbackReason}`}
        </Alert>
      )}
      <ValidationTable />
      <Card>
        <CardContent>
          <Typography component="h2" variant="h6" gutterBottom>{l.sourcesTitle}</Typography>
          <List dense>
            {l.sources.map(([name, role], i) => (
              <ListItem key={name} disableGutters>
                <ListItemText primary={<Link href={SOURCE_URLS[i]} target="_blank" rel="noopener noreferrer">{name}</Link>} secondary={role} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography component="h2" variant="h6" gutterBottom>{l.assumptionsTitle}</Typography>
          {solar.error && <Alert severity="error">{solar.error.message}</Alert>}
          {solar.data && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                {l.method(solar.data.meta.methodVersion, solar.data.meta.sources.join(' ; '))}
              </Typography>
              <List dense lang="fr">
                {solar.data.meta.assumptions.map((a) => <ListItem key={a} disableGutters><ListItemText primary={a} /></ListItem>)}
              </List>
              {t.locale !== 'fr-FR' && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{l.apiLanguageNote}</Typography>}
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography component="h2" variant="h6" gutterBottom>{l.notTitle}</Typography>
          <List dense>
            {l.not.map((n) => <ListItem key={n} disableGutters><ListItemText primary={n} /></ListItem>)}
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}
