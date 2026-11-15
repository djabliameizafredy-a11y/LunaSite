'use client';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useI18n, type Locale } from '@/i18n';

/** Bascule FR | EN, visible partout (en-tête, barre mobile, accueil). */
export function LanguageSwitch({ onDark = false }: { onDark?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <ToggleButtonGroup size="small" exclusive value={locale} onChange={(_e, v: Locale | null) => v && setLocale(v)} aria-label={t.lang.label}
      sx={onDark ? { '& .MuiToggleButton-root': { color: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.3)' },
        '& .Mui-selected': { color: '#fff !important', bgcolor: 'rgba(255,255,255,0.16) !important' } } : undefined}>
      <ToggleButton value="fr" lang="fr" aria-label={t.lang.fr} sx={{ px: 1, py: 0.25, fontWeight: 600, fontSize: '0.75rem' }}>FR</ToggleButton>
      <ToggleButton value="en" lang="en" aria-label={t.lang.en} sx={{ px: 1, py: 0.25, fontWeight: 600, fontSize: '0.75rem' }}>EN</ToggleButton>
    </ToggleButtonGroup>
  );
}
