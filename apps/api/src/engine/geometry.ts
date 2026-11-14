import { MOON_RADIUS_KM, type Vec3 } from './lunar-frame';

const DEG = Math.PI / 180;

export interface LocalFrame {
  up: Vec3;
  east: Vec3;
  north: Vec3;
  /** Position du site dans le repère lunaire fixe, km. */
  position: Vec3;
}

export function localFrame(latDeg: number, lonDeg: number, elevationM: number | null): LocalFrame {
  const la = latDeg * DEG;
  const lo = lonDeg * DEG;
  const up: Vec3 = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  const east: Vec3 = [-Math.sin(lo), Math.cos(lo), 0];
  const north: Vec3 = [-Math.sin(la) * Math.cos(lo), -Math.sin(la) * Math.sin(lo), Math.cos(la)];
  const r = MOON_RADIUS_KM + (elevationM ?? 0) / 1000;
  return { up, east, north, position: [up[0] * r, up[1] * r, up[2] * r] };
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Élévation (°) au-dessus de l'horizon géométrique local et azimut (° depuis le
 * Nord, sens horaire vers l'Est) d'un corps dont le vecteur Lune-centre -> corps
 * est `bodyFromMoonCenter`. La parallaxe (le site n'est pas au centre de la Lune)
 * est prise en compte : elle atteint ~0,26° pour la Terre.
 */
export function elevAz(frame: LocalFrame, bodyFromMoonCenter: Vec3): { elevationDeg: number; azimuthDeg: number } {
  const v: Vec3 = [
    bodyFromMoonCenter[0] - frame.position[0],
    bodyFromMoonCenter[1] - frame.position[1],
    bodyFromMoonCenter[2] - frame.position[2],
  ];
  const n = Math.hypot(...v);
  const elevationDeg = Math.asin(dot(v, frame.up) / n) / DEG;
  let azimuthDeg = Math.atan2(dot(v, frame.east), dot(v, frame.north)) / DEG;
  if (azimuthDeg < 0) azimuthDeg += 360;
  return { elevationDeg, azimuthDeg };
}

/** Unitaire du vecteur site -> corps (pour l'angle d'incidence sur un panneau). */
export function directionFromSite(frame: LocalFrame, bodyFromMoonCenter: Vec3): Vec3 {
  const v: Vec3 = [
    bodyFromMoonCenter[0] - frame.position[0],
    bodyFromMoonCenter[1] - frame.position[1],
    bodyFromMoonCenter[2] - frame.position[2],
  ];
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
}

/** Masque d'horizon : élévation minimale (°) pour qu'un corps soit visible à cet azimut. */
export type HorizonMask = (azimuthDeg: number) => number;

export const flatHorizon: HorizonMask = () => 0;

/** Construit un masque à partir d'un profil [azimut, élévation] (interpolation linéaire, circulaire). */
export function maskFromProfile(profile: Array<[number, number]>): HorizonMask {
  const p = [...profile].sort((a, b) => a[0] - b[0]);
  return (az) => {
    const a = ((az % 360) + 360) % 360;
    for (let i = 0; i < p.length; i++) {
      const [a0, e0] = p[i];
      const [a1, e1] = p[(i + 1) % p.length];
      const span = ((a1 - a0 + 360) % 360) || 360;
      const off = (a - a0 + 360) % 360;
      if (off <= span) return e0 + ((e1 - e0) * off) / span;
    }
    return p[0][1];
  };
}

/** Masque à partir d'élévations uniformément réparties en azimut (valeurs[i] pour l'azimut i·360/n), interpolation circulaire. */
export function maskFromUniform(values: number[]): HorizonMask {
  const n = values.length;
  return (az) => {
    const x = ((((az % 360) + 360) % 360) / 360) * n;
    const i = Math.floor(x) % n;
    const f = x - Math.floor(x);
    return values[i] * (1 - f) + values[(i + 1) % n] * f;
  };
}
