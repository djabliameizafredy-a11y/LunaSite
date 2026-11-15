'use client';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import type { ResultMeta } from '@lunasite/shared-types';
import { useT } from '@/i18n';

const LEVEL_COLOR = { mock: 'error', simplified: 'warning', 'terrain-aware': 'success' } as const;

/** Niveau de calcul toujours visible à côté d'un résultat, avec sources et hypothèses au survol. */
export function MetaChip({ meta }: { meta: ResultMeta }) {
  const t = useT();
  const l = { label: t.meta.level[meta.calculationLevel], color: LEVEL_COLOR[meta.calculationLevel] };
  return (
    <Tooltip
      arrow
      title={
        <Box sx={{ p: 0.5, maxWidth: 360 }}>
          <Typography variant="caption" component="div" sx={{ fontWeight: 700 }}>
            {t.meta.method(meta.methodVersion, meta.stepMinutes)}
          </Typography>
          <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>{t.meta.sources(meta.sources.join(' ; '))}</Typography>
          {meta.assumptions.slice(0, 4).map((a) => (
            <Typography key={a} variant="caption" component="div" sx={{ mt: 0.5 }}>• {a}</Typography>
          ))}
        </Box>
      }
    >
      <Chip size="small" color={l.color} variant={meta.isMock ? 'filled' : 'outlined'} label={meta.isMock ? `${l.label} (mock)` : l.label} />
    </Tooltip>
  );
}
