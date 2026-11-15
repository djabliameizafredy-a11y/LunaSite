'use client';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useT } from '@/i18n';

/** 404 : ce qui s'est passé + comment repartir. */
export default function NotFound() {
  const t = useT();
  return (
    <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: '#05070a', color: '#fff' }}>
      <Stack sx={{ maxWidth: 520, gap: 2 }}>
        <Typography component="p" sx={{ color: '#fbbf24', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{t.states.notFoundCode}</Typography>
        <Typography component="h1" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {t.states.notFoundTitle}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
          {t.states.notFoundText}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, mt: 1 }}>
          <Button component={Link} href="/" variant="contained">{t.common.backHome}</Button>
          <Button component={Link} href="/dashboard" variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>{t.common.exploreSites}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
