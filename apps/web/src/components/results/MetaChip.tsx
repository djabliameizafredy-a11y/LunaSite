'use client';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import type { ResultMeta } from '@lunasite/shared-types';

const LEVEL = {
  mock: { label: 'Données de démo', color: 'error' },
  simplified: { label: 'Calcul simplifié', color: 'warning' },
  'terrain-aware': { label: 'Avec relief LOLA', color: 'success' },
} as const;

/** Niveau de calcul toujours visible à côté d'un résultat, avec sources et hypothèses au survol. */
export function MetaChip({ meta }: { meta: ResultMeta }) {
  const l = LEVEL[meta.calculationLevel];
  return (
    <Tooltip
      arrow
      title={
        <Box sx={{ p: 0.5, maxWidth: 360 }}>
          <Typography variant="caption" component="div" sx={{ fontWeight: 700 }}>
            Méthode {meta.methodVersion} · pas de {meta.stepMinutes} min
          </Typography>
          <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>Sources : {meta.sources.join(' ; ')}</Typography>
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
