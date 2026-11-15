/** Formatage des valeurs affichées. Règle : une valeur absente s'affiche « indisponible », jamais 0. */

const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export const UNAVAILABLE = 'indisponible';

export const fmtHours = (h: number | null | undefined) => (h == null ? UNAVAILABLE : `${nf1.format(h)} h`);
export const fmtPct = (fraction: number | null | undefined) => (fraction == null ? UNAVAILABLE : `${nf0.format(fraction * 100)} %`);
export const fmtDeg = (d: number | null | undefined) => (d == null ? UNAVAILABLE : `${nf1.format(d)}°`);
export const fmtNum = (n: number | null | undefined, unit = '') => (n == null ? UNAVAILABLE : `${nf1.format(n)}${unit ? ` ${unit}` : ''}`);

export function fmtEnergy(wh: number | null | undefined) {
  if (wh == null) return UNAVAILABLE;
  return wh >= 1000 ? `${nf1.format(wh / 1000)} kWh` : `${nf0.format(wh)} Wh`;
}

const dtf = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const df = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dayf = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

export const fmtDateTimeUTC = (iso: string | Date) => `${dtf.format(new Date(iso))} UTC`;
export const fmtDateUTC = (iso: string | Date) => df.format(new Date(iso));
export const fmtDayShort = (iso: string | Date) => dayf.format(new Date(iso));

/** Période [start, end) lisible, avec fin exclusive rendue explicite. */
export const fmtPeriod = (p: { start: string; end: string }) => `${fmtDateTimeUTC(p.start)} → ${fmtDateTimeUTC(p.end)} (fin exclue)`;

export const todayUTC = () => new Date().toISOString().slice(0, 10);

/** Pas de calcul adapté à la durée : assez fin pour les fenêtres, sans dépasser le budget de l'API. */
export const stepFor = (days: number) => (days <= 1 ? 15 : days <= 7 ? 30 : 60);
