'use client';
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TerrainRoundedIcon from '@mui/icons-material/TerrainRounded';

// Repris de CardAlert.tsx du template ; message adapté : rappel des limites du démonstrateur.
export default function CardAlert({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Card variant="outlined" sx={{ m: 1.5, flexShrink: 0 }}>
      <CardContent>
        <TerrainRoundedIcon fontSize="small" />
        <Typography gutterBottom sx={{ fontWeight: 600 }}>Démonstrateur pédagogique</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Relief LOLA pour les sites polaires, horizon plat ailleurs. Pas un outil opérationnel.
        </Typography>
        <Button component={Link} href="/limits" variant="contained" size="small" fullWidth onClick={onNavigate}>
          Voir les limites
        </Button>
      </CardContent>
    </Card>
  );
}
