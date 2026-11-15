'use client';
import { Alert, Card, CardContent, Stack, Typography } from '@mui/material';
import { Gauge } from '@mui/x-charts/Gauge';
import type { MissionScore } from '@lunasite/shared-types';
import { MetaChip } from './MetaChip';

const pct = (w: number) => `${Math.round(w * 100)} %`;

/** Score de faisabilité : aide à la comparaison (ajout de l'équipe), jamais à la place des 4 visualisations. */
export function ScoreCard({ score }: { score: MissionScore }) {
  const global = score.globalScore;
  const shown = global ?? score.partialScore;
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>Score de faisabilité</Typography>
          <MetaChip meta={score.meta} />
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mt: 1 }}>
          <Gauge width={120} height={120} value={shown} valueMin={0} valueMax={100} text={`${Math.round(shown)}`} />
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="body2">Solaire : <b>{Math.round(score.solarScore)}</b></Typography>
            <Typography variant="body2">Communication : <b>{Math.round(score.communicationScore)}</b></Typography>
            <Typography variant="body2">Terrain : <b>{score.terrainScore == null ? 'indisponible' : Math.round(score.terrainScore)}</b></Typography>
          </Stack>
        </Stack>
        {global == null && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            Score <b>partiel</b> ({score.partialScoreCriteria.join(' + ')}) : {score.globalScoreUnavailableReason ?? 'un critère manque'}.
          </Alert>
        )}
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1.5 }}>
          Pondération de l'équipe, pas un standard NASA : solaire {pct(score.weights.solar)}, communication {pct(score.weights.communication)}, terrain {pct(score.weights.terrain)}.
        </Typography>
      </CardContent>
    </Card>
  );
}
