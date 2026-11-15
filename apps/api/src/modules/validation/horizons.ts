/**
 * Client minimal de l'API JPL Horizons (https://ssd-api.jpl.nasa.gov/doc/horizons.html, version 1.2).
 * Éphéméride OBSERVER depuis un site à la surface de la Lune : CENTER='coord@301', COORD_TYPE='GEODETIC',
 * SITE_COORD='E-lon(deg),lat(deg),alt(km)', QUANTITIES='4' (azimut / élévation apparents, sans atmosphère).
 * Azimut : depuis le Nord, sens horaire vers l'Est (même convention que notre moteur).
 */
export const HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
export const HORIZONS_API_VERSION = '1.2';

import type { ReferenceBody } from '@lunasite/shared-types';
export type { ReferenceBody };
export const HORIZONS_TARGET: Record<ReferenceBody, string> = { sun: '10', earth: '399' };

export interface HorizonsSite { latitude: number; longitude: number; elevationM: number | null }
export interface HorizonsPoint { t: string; azimuthDeg: number; elevationDeg: number }

const q = (v: string) => `'${v}'`;

/** Construit l'URL d'une requête (paramètres entre apostrophes, comme dans la documentation). */
export function horizonsUrl(body: ReferenceBody, site: HorizonsSite, start: string, stop: string, step: string): string {
  const altKm = ((site.elevationM ?? 0) / 1000).toFixed(4);
  const params: Record<string, string> = {
    format: 'json',
    COMMAND: q(HORIZONS_TARGET[body]),
    OBJ_DATA: q('NO'),
    MAKE_EPHEM: q('YES'),
    EPHEM_TYPE: q('OBSERVER'),
    CENTER: q('coord@301'),
    COORD_TYPE: q('GEODETIC'),
    SITE_COORD: q(`${site.longitude},${site.latitude},${altKm}`),
    START_TIME: q(start),
    STOP_TIME: q(stop),
    STEP_SIZE: q(step),
    QUANTITIES: q('4'),
    ANG_FORMAT: q('DEG'),
    CSV_FORMAT: q('YES'),
    EXTRA_PREC: q('YES'),
    TIME_DIGITS: q('SECONDS'),
  };
  return `${HORIZONS_API}?${new URLSearchParams(params).toString()}`;
}

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** « 2026-Nov-14 06:00:00 » (UT) -> ISO 8601. */
export function horizonsDateToIso(s: string): string {
  const m = /^(\d{4})-([A-Z][a-z]{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d+)?$/.exec(s.trim());
  if (!m || !MONTHS[m[2]]) throw new Error(`date Horizons illisible : « ${s} »`);
  return `${m[1]}-${MONTHS[m[2]]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ?? ''}Z`;
}

/**
 * Extrait le tableau CSV entre $$SOE et $$EOE. Colonnes attendues : date, présence solaire, corps interférent,
 * azimut, élévation (vérifiées dans l'en-tête). Lève une erreur explicite si le format a changé.
 */
export function parseHorizonsResult(result: string): HorizonsPoint[] {
  const header = /^\s*Date__\(UT\)__HR:MN:SS.*$/m.exec(result)?.[0];
  if (!header || !/Azimuth_\(a-app\)/.test(header) || !/Elevation_\(a-app\)/.test(header))
    throw new Error('en-tête Horizons inattendu (colonnes Azimuth/Elevation absentes)');
  const start = result.indexOf('$$SOE');
  const end = result.indexOf('$$EOE');
  if (start < 0 || end < start) throw new Error('marqueurs $$SOE / $$EOE absents : pas de tableau dans la réponse');
  return result.slice(start + 5, end).split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const az = Number(cols[3]);
    const el = Number(cols[4]);
    if (!Number.isFinite(az) || !Number.isFinite(el)) throw new Error(`ligne Horizons illisible : « ${line} »`);
    return { t: horizonsDateToIso(cols[0]), azimuthDeg: az, elevationDeg: el };
  });
}

interface HorizonsJson { signature?: { version?: string; source?: string }; result?: string; error?: string }

/** Lit la réponse JSON de l'API (vérifie la version annoncée, comme le demande la documentation). */
export function parseHorizonsResponse(json: HorizonsJson): HorizonsPoint[] {
  if (json.error) throw new Error(`Horizons : ${json.error}`);
  if (json.signature?.version !== HORIZONS_API_VERSION)
    throw new Error(`version d'API Horizons ${json.signature?.version ?? 'inconnue'} (attendue ${HORIZONS_API_VERSION}) : format non garanti`);
  if (!json.result) throw new Error('réponse Horizons sans champ « result »');
  return parseHorizonsResult(json.result);
}

/** Appel réseau (utilisé par le script d'import uniquement, jamais par une requête de l'API publique). */
export async function fetchHorizons(body: ReferenceBody, site: HorizonsSite, start: string, stop: string, step: string): Promise<HorizonsPoint[]> {
  const res = await fetch(horizonsUrl(body, site, start, stop, step));
  if (!res.ok) throw new Error(`Horizons HTTP ${res.status}`);
  return parseHorizonsResponse((await res.json()) as HorizonsJson);
}
