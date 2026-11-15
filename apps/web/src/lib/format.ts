/** Formatage des valeurs affichées. Règle : une valeur absente s'affiche « indisponible », jamais 0. Suit la langue choisie. */

let LOCALE = 'fr-FR';
let nf1 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
let nf0 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
let dtf = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
let df = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
let dayf = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
let dtsf = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', hour12: false });
let unavailable = 'indisponible';

/** Appelé par I18nProvider à chaque changement de langue. */
export function setFormatLocale(locale: string) {
  LOCALE = locale;
  nf1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  dtf = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
  df = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  dayf = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  dtsf = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', hour12: false });
  unavailable = locale.startsWith('fr') ? 'indisponible' : 'unavailable';
}

export const unavailableText = () => unavailable;
/** @deprecated utiliser unavailableText() (suit la langue). */
export const UNAVAILABLE = 'indisponible';

const pct = () => (LOCALE.startsWith('fr') ? ' %' : '%');

export const fmtHours = (h: number | null | undefined) => (h == null ? unavailable : `${nf1.format(h)} h`);
export const fmtPct = (fraction: number | null | undefined) => (fraction == null ? unavailable : `${nf0.format(fraction * 100)}${pct()}`);
export const fmtDeg = (d: number | null | undefined) => (d == null ? unavailable : `${nf1.format(d)}°`);
export const fmtNum = (n: number | null | undefined, unit = '') => (n == null ? unavailable : `${nf1.format(n)}${unit ? ` ${unit}` : ''}`);

export function fmtEnergy(wh: number | null | undefined) {
  if (wh == null) return unavailable;
  return wh >= 1000 ? `${nf1.format(wh / 1000)} kWh` : `${nf0.format(wh)} Wh`;
}

export const fmtDateTimeUTC = (iso: string | Date) => `${dtf.format(new Date(iso))} UTC`;
/** Avec les secondes (vue en direct). */
export const fmtDateTimeSecUTC = (iso: string | Date) => `${dtsf.format(new Date(iso))} UTC`;
export const fmtDateUTC = (iso: string | Date) => df.format(new Date(iso));
export const fmtDayShort = (iso: string | Date) => dayf.format(new Date(iso));

/** Période [start, end) lisible, avec fin exclusive rendue explicite. */
export const fmtPeriod = (p: { start: string; end: string }) =>
  `${fmtDateTimeUTC(p.start)} → ${fmtDateTimeUTC(p.end)} ${LOCALE.startsWith('fr') ? '(fin exclue)' : '(end excluded)'}`;

export const todayUTC = () => new Date().toISOString().slice(0, 10);

/** Pas de calcul adapté à la durée : assez fin pour les fenêtres, sans dépasser le budget de l'API. */
export const stepFor = (days: number) => (days <= 1 ? 15 : days <= 7 ? 30 : 60);
