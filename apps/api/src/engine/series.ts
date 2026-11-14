import type { EnergyPotential, TimeSeriesPoint, Window } from '@lunasite/shared-types';
import { bodyState, type BodyState } from './lunar-frame';
import { directionFromSite, elevAz, localFrame, type HorizonMask, type LocalFrame } from './geometry';

export const METHOD_VERSION = 'lunasite-geom-0.1.0';
/** Constante solaire totale à 1 UA (Kopp & Lean 2011), W/m². */
export const SOLAR_CONSTANT_WM2 = 1360.8;

export interface Grid {
  times: Date[];
  states: BodyState[];
  stepMinutes: number;
  start: Date;
  end: Date;
}

const gridCache = new Map<string, Grid>();

/** Éphémérides sur la période : calculées une seule fois, partagées entre sites (et mises en cache). */
export function buildGrid(start: Date, end: Date, stepMinutes: number): Grid {
  const key = `${start.toISOString()}|${end.toISOString()}|${stepMinutes}`;
  const hit = gridCache.get(key);
  if (hit) return hit;
  const stepMs = stepMinutes * 60_000;
  const times: Date[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += stepMs) times.push(new Date(t));
  const grid: Grid = { times, states: times.map(bodyState), stepMinutes, start, end };
  if (gridCache.size > 50) gridCache.delete(gridCache.keys().next().value as string);
  gridCache.set(key, grid);
  return grid;
}

export interface SiteInput {
  latitude: number;
  longitude: number;
  elevationM: number | null;
  horizon: HorizonMask;
}

export interface BodySeries {
  points: TimeSeriesPoint[];
  /** Au-dessus du masque d'horizon à chaque pas. */
  visible: boolean[];
}

function bodySeries(grid: Grid, site: SiteInput, which: 'sun' | 'earth'): BodySeries {
  const frame = localFrame(site.latitude, site.longitude, site.elevationM);
  const points: TimeSeriesPoint[] = [];
  const visible: boolean[] = [];
  grid.states.forEach((s, i) => {
    const { elevationDeg, azimuthDeg } = elevAz(frame, which === 'sun' ? s.sunMoonFixed : s.earthMoonFixed);
    points.push({ t: grid.times[i].toISOString(), elevationDeg: round(elevationDeg, 3), azimuthDeg: round(azimuthDeg, 2) });
    visible.push(elevationDeg > site.horizon(azimuthDeg));
  });
  return { points, visible };
}

export const sunSeries = (g: Grid, s: SiteInput) => bodySeries(g, s, 'sun');
export const earthSeries = (g: Grid, s: SiteInput) => bodySeries(g, s, 'earth');

export function round(x: number, d: number): number {
  const f = 10 ** d;
  return Math.round(x * f) / f;
}

/**
 * Fenêtres de visibilité (corps au-dessus du masque). Les bords sont l'instant
 * d'échantillonnage le plus proche : précision = pas de temps (le document de
 * conception interdit d'annoncer mieux). Les fenêtres coupées par la période
 * sont marquées tronquées.
 */
export function windowsFrom(grid: Grid, s: BodySeries): Window[] {
  const out: Window[] = [];
  const stepH = grid.stepMinutes / 60;
  let i = 0;
  const n = s.visible.length;
  while (i < n) {
    if (!s.visible[i]) { i++; continue; }
    let j = i;
    let maxEl = -90;
    while (j < n && s.visible[j]) { maxEl = Math.max(maxEl, s.points[j].elevationDeg); j++; }
    out.push({
      start: grid.times[i].toISOString(),
      end: new Date(grid.times[j - 1].getTime() + grid.stepMinutes * 60_000).toISOString(),
      durationHours: round((j - i) * stepH, 3),
      truncatedStart: i === 0,
      truncatedEnd: j === n,
      maxElevationDeg: maxEl,
    });
    i = j;
  }
  return out;
}

export function longestGapHours(grid: Grid, s: BodySeries): number {
  let best = 0, run = 0;
  for (const v of s.visible) { run = v ? 0 : run + 1; best = Math.max(best, run); }
  return round(best * (grid.stepMinutes / 60), 3);
}

export function visibleHours(grid: Grid, s: BodySeries): number {
  return round(s.visible.filter(Boolean).length * (grid.stepMinutes / 60), 3);
}

/** Heures restantes avant la fin de la fenêtre en cours au début de la période (null si hors fenêtre). */
export function hoursUntilSet(grid: Grid, s: BodySeries): number | null {
  if (!s.visible[0]) return null;
  let j = 0;
  while (j < s.visible.length && s.visible[j]) j++;
  if (j === s.visible.length) return null; // ne se couche pas dans la période : inconnu, pas 0
  return round(j * (grid.stepMinutes / 60), 3);
}

export interface PanelParams {
  panelAreaM2: number;
  efficiency: number;
  panelTiltDeg: number;
  panelAzimuthDeg: number;
}

export const DEFAULT_PANEL: PanelParams = { panelAreaM2: 1, efficiency: 0.3, panelTiltDeg: 0, panelAzimuthDeg: 0 };

/** P(t) = G(t) · max(0, cos i) · surface · rendement, nulle sous l'horizon (masque inclus). */
export function energyPotential(grid: Grid, site: SiteInput, sun: BodySeries, p: PanelParams): EnergyPotential {
  const frame: LocalFrame = localFrame(site.latitude, site.longitude, site.elevationM);
  const tilt = (p.panelTiltDeg * Math.PI) / 180;
  const paz = (p.panelAzimuthDeg * Math.PI) / 180;
  // Normale du panneau dans le repère local : inclinée de `tilt` vers l'azimut `paz`.
  const nrm = [0, 1, 2].map(
    (k) =>
      Math.cos(tilt) * frame.up[k] +
      Math.sin(tilt) * (Math.cos(paz) * frame.north[k] + Math.sin(paz) * frame.east[k]),
  );
  const stepH = grid.stepMinutes / 60;
  let wh = 0, peak = 0;
  grid.states.forEach((st, i) => {
    if (!sun.visible[i]) return;
    const d = directionFromSite(frame, st.sunMoonFixed);
    const cosI = Math.max(0, d[0] * nrm[0] + d[1] * nrm[1] + d[2] * nrm[2]);
    const g = SOLAR_CONSTANT_WM2 / st.sunDistanceAu ** 2;
    const pW = g * cosI * p.panelAreaM2 * p.efficiency;
    wh += pW * stepH;
    peak = Math.max(peak, pW);
  });
  const periodH = grid.times.length * stepH;
  return {
    parameters: { ...p, solarConstantWm2: SOLAR_CONSTANT_WM2 },
    indicativeEnergyWh: round(wh, 2),
    peakPowerW: round(peak, 2),
    meanPowerW: round(periodH ? wh / periodH : 0, 2),
  };
}

