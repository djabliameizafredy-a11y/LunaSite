'use client';
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TerrainRoundedIcon from '@mui/icons-material/TerrainRounded';
import { useT } from '@/i18n';

// Repris de CardAlert.tsx du template ; message adapté : rappel des limites du démonstrateur.
export default function CardAlert({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  return (
    <Card variant="outlined" sx={{ m: 1.5, flexShrink: 0 }}>
      <CardContent>
        <TerrainRoundedIcon fontSize="small" />
        <Typography gutterBottom sx={{ fontWeight: 600 }}>{t.sidebar.demoTitle}</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {t.sidebar.demoText}
        </Typography>
        <Button component={Link} href="/limits" variant="contained" size="small" fullWidth onClick={onNavigate}>
          {t.sidebar.seeLimits}
        </Button>
      </CardContent>
    </Card>
  );
}
