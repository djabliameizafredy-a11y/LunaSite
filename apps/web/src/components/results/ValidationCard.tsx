'use client';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import type { BodyComparison } from '@lunasite/shared-types';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { fmtDateUTC } from '@/lib/format';
import { useT } from '@/i18n';
import { unavailableText } from '@/lib/format';

/** Écart affiché en secondes d'arc quand il est petit (plus parlant que 0,001°). */
export function fmtAngleDiff(deg: number | null): string {
  if (deg == null) return unavailableText();
  return deg < 1 / 60 ? `${(deg * 3600).toFixed(1)}″` : `${deg.toFixed(3)}°`;
}

/** Verdict lisible : < 0,05° = l'écart est invisible à l'échelle des graphiques. */
const verdict = (c: BodyComparison | null) =>
  !c || c.samples === 0 ? null : (c.maxAbsElevationDiffDeg ?? 1) < 0.05 && c.visibilityDisagreements === 0;

function Row({ label, c }: { label: string; c: BodyComparison | null }) {
  const t = useT();
  const ok = verdict(c);
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
      <div>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {c && c.samples ? t.validation.samples(c.samples, fmtAngleDiff(c.maxAbsElevationDiffDeg), fmtAngleDiff(c.maxAbsAzimuthDiffDeg)) : t.validation.noRef}
        </Typography>
      </div>
      {ok != null && <Chip size="small" color={ok ? 'success' : 'warning'} label={ok ? t.validation.ok : t.validation.check} />}
    </Stack>
  );
}

/** Preuve de justesse : nos positions Soleil/Terre comparées à JPL Horizons (NASA) pour le site choisi. */
export function ValidationCard({ siteId }: { siteId: string }) {
  const v = useAsync(() => api.siteValidation(siteId), [siteId]);
  const t = useT();
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center', mb: 1 }}>
          <VerifiedRoundedIcon color="success" fontSize="small" />
          <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600 }}>{t.validation.title}</Typography>
        </Stack>
        {v.loading && <Skeleton variant="rounded" height={80} />}
        {v.error && <Alert severity="error">{v.error.message}</Alert>}
        {v.data && !v.data.available && <Alert severity="info">{v.data.reason}</Alert>}
        {v.data?.available && (
          <Stack sx={{ gap: 1.5 }}>
            <Row label={t.validation.sun} c={v.data.sun} />
            <Row label={t.validation.earth} c={v.data.earth} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t.validation.reference(v.data.source?.ephemeris ?? '', v.data.source ? t.validation.range(fmtDateUTC(v.data.source.start), fmtDateUTC(v.data.source.stop), v.data.source.step) : '')}{' '}
              {t.validation.flatNote}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
