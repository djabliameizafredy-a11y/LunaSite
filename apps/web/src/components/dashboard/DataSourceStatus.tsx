'use client';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useT } from '@/i18n';

/** Emplacement du bloc « utilisateur » du template : on y montre d'où vient le catalogue (jamais un repli silencieux). */
export default function DataSourceStatus() {
  const health = useAsync(() => api.health(), []);
  const t = useT();
  const fromDb = health.data?.catalogueSource === 'database';
  const label = health.loading ? t.sidebar.connecting : health.error ? t.sidebar.apiDown : fromDb ? t.sidebar.fromDb : t.sidebar.embedded;
  return (
    <Stack direction="row" sx={{ p: 2, gap: 1, alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: health.error ? 'error.main' : fromDb ? 'success.main' : 'warning.main' }}>
        <StorageRoundedIcon fontSize="small" />
      </Avatar>
      <Box sx={{ mr: 'auto' }}>
        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>{t.sidebar.dataSource}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      </Box>
    </Stack>
  );
}
