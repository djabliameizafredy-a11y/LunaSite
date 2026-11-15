'use client';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

/** Erreur : ce qui s'est passé + une action pour s'en sortir (jamais une page blanche). */
export function ErrorState({ title, error }: { title: string; error: Error }) {
  return (
    <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => window.location.reload()}>Réessayer</Button>}>
      <b>{title}.</b> {error.message}
    </Alert>
  );
}

/** Chargement long : on prévient au lieu de laisser l'utilisateur deviner. */
export function SlowNotice({ slow }: { slow: boolean }) {
  if (!slow) return null;
  return <Alert severity="info" sx={{ mb: 2 }}>Cela prend plus de temps que prévu : le calcul sur une longue période peut durer quelques secondes.</Alert>;
}
