'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fr } from './fr';
import { en } from './en';
import { setFormatLocale } from '@/lib/format';

export type Dict = typeof fr;
export type Locale = 'fr' | 'en';
const DICTS: Record<Locale, Dict> = { fr, en };
const STORAGE_KEY = 'lunasite-lang';

/** Dictionnaire courant hors React (messages d'erreur de lib/api). */
let current: Dict = fr;
export const currentDict = () => current;

interface I18n { locale: Locale; t: Dict; setLocale: (l: Locale) => void }
const Ctx = createContext<I18n>({ locale: 'fr', t: fr, setLocale: () => {} });

function apply(l: Locale) {
  current = DICTS[l];
  setFormatLocale(DICTS[l].locale);
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}

/**
 * Langue de l'interface. Rendu serveur en français (pages statiques), puis : choix mémorisé, sinon langue du navigateur.
 * Changer de langue remonte l'arbre sous `children` (clé) pour que les formats de nombres et de dates suivent aussi.
 */
export function I18nProvider({ children }: { children: (locale: Locale) => React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* stockage bloqué : on garde la détection */ }
    const l: Locale = saved === 'fr' || saved === 'en' ? saved : navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    apply(l);
    setLocaleState(l);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    apply(l);
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignoré */ }
  }, []);

  const value = useMemo(() => ({ locale, t: DICTS[locale], setLocale }), [locale, setLocale]);
  return <Ctx.Provider value={value}>{children(locale)}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;

const TITLE_KEYS: Record<string, keyof Dict['nav']> = { '/dashboard': 'overview', '/horizon': 'horizon', '/sites': 'catalogue', '/limits': 'limits', '/about': 'about' };

/** Met à jour le titre de l'onglet dans la langue choisie. */
export function DocumentTitle() {
  const { t } = useI18n();
  const pathname = usePathname();
  useEffect(() => {
    const key = TITLE_KEYS[pathname];
    const wanted = key ? `${t.nav[key]} · LunaSite` : pathname === '/' ? t.docTitle.home : null;
    if (!wanted) return;
    const fix = () => { if (document.title !== wanted) document.title = wanted; };
    fix();
    // Next réécrit <title> depuis les métadonnées (en français) après la navigation : on réapplique.
    const obs = new MutationObserver(fix);
    obs.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => obs.disconnect();
  }, [t, pathname]);
  return null;
}
