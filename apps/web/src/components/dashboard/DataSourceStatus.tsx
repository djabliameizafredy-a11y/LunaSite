'use client';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';

/** Emplacement du bloc « utilisateur » du template : on y montre d'où vient le catalogue (jamais un repli silencieux). */
export default function DataSourceStatus() {
  const health = useAsync(() => api.health(), []);
  const fromDb = health.data?.catalogueSource === 'database';
  const label = health.loading ? 'connexion…' : health.error ? 'API injoignable' : fromDb ? 'PostgreSQL (Supabase)' : 'catalogue embarqué';
  return (
    <Stack direction="row" sx={{ p: 2, gap: 1, alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: health.error ? 'error.main' : fromDb ? 'success.main' : 'warning.main' }}>
        <StorageRoundedIcon fontSize="small" />
      </Avatar>
      <Box sx={{ mr: 'auto' }}>
        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>Source des données</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      </Box>
    </Stack>
  );
}
