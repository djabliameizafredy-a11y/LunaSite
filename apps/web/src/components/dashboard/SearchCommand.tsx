'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useDashboard } from './DashboardState';
import { useT } from '@/i18n';

type Kind = 'Pages' | 'Visualisations' | 'Sites';
type Entry = { kind: Kind; label: string; hint: string; keywords: string; href: string; siteId?: string };

const PAGE_HREFS: Record<string, string> = { home: '/', overview: '/dashboard', horizon: '/horizon', catalogue: '/sites', limits: '/limits', about: '/about' };

// Ancres posées dans la vue d'ensemble (le défilement est fait une fois les résultats chargés).
const VIZ_IDS = ['soleil', 'terre', 'fenetres', 'energie', 'heures', 'carte', 'score', 'validation'];

const filter = createFilterOptions<Entry>({ stringify: (o) => `${o.label} ${o.hint} ${o.keywords}`, ignoreAccents: true, ignoreCase: true });

/** Recherche globale (Ctrl K / ⌘ K) : pages, visualisations et sites. Remplace la recherche du template. */
export function SearchCommand({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { sites, setSiteId } = useDashboard();
  const t = useT();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  const options = useMemo<Entry[]>(() => [
    ...Object.entries(PAGE_HREFS).map(([k, href]) => { const [label, hint, kw] = t.search.pages[k]; return { kind: 'Pages' as const, label, hint, keywords: kw, href }; }),
    ...VIZ_IDS.map((id) => { const [label, hint, kw] = t.search.viz[id]; return { kind: 'Visualisations' as const, label, hint, keywords: kw, href: `/dashboard#${id}` }; }),
    ...(sites.data ?? []).map((s) => ({
      kind: 'Sites' as const, label: s.name, hint: `${s.latitude.toFixed(2)}°, ${s.longitude.toFixed(2)}°E`,
      keywords: `${s.region} ${s.id} ${s.terrain.horizonMask ? 'relief lola' : 'horizon plat'}`, href: '/dashboard', siteId: s.id,
    })),
  ], [sites.data, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Deux instances existent (en-tête bureau, barre mobile) : seule celle dont le bouton est visible répond.
      if (!trigger.current?.offsetParent) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = useCallback((entry: Entry | null) => {
    if (!entry) return;
    setOpen(false);
    if (entry.siteId) setSiteId(entry.siteId);
    router.push(entry.href);
  }, [router, setSiteId]);

  return (
    <>
      {compact ? (
        <IconButton ref={trigger} size="small" aria-label={t.search.iconAria} onClick={() => setOpen(true)}>
          <SearchRoundedIcon fontSize="small" />
        </IconButton>
      ) : (
        <ButtonBase
          ref={trigger}
          onClick={() => setOpen(true)}
          aria-label={t.search.buttonAria}
          sx={(theme) => ({
            gap: 1, px: 1.25, height: 36, minWidth: 220, justifyContent: 'flex-start', borderRadius: `${theme.shape.borderRadius}px`,
            border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'text.secondary', fontSize: '0.875rem',
            transition: 'border-color 150ms', '&:hover': { borderColor: 'text.secondary' },
            '&:focus-visible': { outline: `2px solid ${(theme.vars || theme).palette.primary.main}`, outlineOffset: 2 },
          })}
        >
          <SearchRoundedIcon fontSize="small" />
          <Box component="span" sx={{ mr: 'auto' }}>{t.search.button}</Box>
          <Box component="kbd" sx={{ fontFamily: 'inherit', fontSize: '0.75rem', px: 0.75, py: 0.125, borderRadius: 0.75, border: '1px solid', borderColor: 'divider' }}>Ctrl K</Box>
        </ButtonBase>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" aria-label={t.search.dialog}
        slotProps={{ paper: { sx: { alignSelf: 'flex-start', mt: { xs: 2, sm: '12vh' }, overflow: 'visible' } } }}>
        <Autocomplete<Entry>
          open
          autoHighlight
          forcePopupIcon={false}
          disablePortal
          options={options}
          groupBy={(o) => t.search.groups[o.kind] ?? o.kind}
          filterOptions={filter}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(a, b) => a.kind === b.kind && a.label === b.label}
          onChange={(_e, v) => go(v)}
          noOptionsText={t.search.noResult}
          slotProps={{ paper: { elevation: 0, sx: { borderTop: '1px solid', borderColor: 'divider', borderRadius: 0 } }, listbox: { sx: { maxHeight: '55vh' } } }}
          renderOption={({ key, ...props }, o) => (
            <li key={key} {...props}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{o.label}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{o.hint}</Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus
              placeholder={t.search.placeholder}
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
                },
              }}
              sx={{ p: 1.5, '& .MuiOutlinedInput-notchedOutline': { border: 0 } }}
            />
          )}
        />
      </Dialog>
    </>
  );
}
