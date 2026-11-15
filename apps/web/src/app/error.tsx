'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useT } from '@/i18n';

/** Erreur inattendue (500 côté interface) : message humain + réessayer, détail dans la console. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[LunaSite]', error); }, [error]);
  const t = useT();
  return (
    <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: 'background.default' }}>
      <Stack sx={{ maxWidth: 520, gap: 2 }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>{t.states.errorTitle}</Typography>
        <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
          {t.states.errorText}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, mt: 1 }}>
          <Button variant="contained" onClick={reset}>{t.common.retry}</Button>
          <Button component={Link} href="/" variant="outlined">{t.common.backHome}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
