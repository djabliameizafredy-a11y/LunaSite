'use client';
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useT } from '@/i18n';

// Repris de HighlightedCard.tsx du template.
export function HighlightCard() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const t = useT();
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <TravelExploreRoundedIcon />
        <Typography component="h2" variant="subtitle2" gutterBottom sx={{ fontWeight: '600' }}>{t.highlight.title}</Typography>
        <Typography sx={{ color: 'text.secondary', mb: '8px' }}>
          {t.highlight.text}
        </Typography>
        <Button component={Link} href="/sites" variant="contained" size="small" color="primary" endIcon={<ChevronRightRoundedIcon />} fullWidth={isSmallScreen}>
          {t.common.seeCatalogue}
        </Button>
      </CardContent>
    </Card>
  );
}
