'use client';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useT } from '@/i18n';

/** Erreur : ce qui s'est passé + une action pour s'en sortir (jamais une page blanche). */
export function ErrorState({ title, error }: { title: string; error: Error }) {
  const t = useT();
  return (
    <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => window.location.reload()}>{t.common.retry}</Button>}>
      <b>{title}.</b> {error.message}
    </Alert>
  );
}

/** Chargement long : on prévient au lieu de laisser l'utilisateur deviner. */
export function SlowNotice({ slow }: { slow: boolean }) {
  const t = useT();
  if (!slow) return null;
  return <Alert severity="info" sx={{ mb: 2 }}>{t.states.slow}</Alert>;
}
