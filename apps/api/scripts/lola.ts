/**
 * Lecture du DEM polaire LOLA (PDS "LDEM_80S_80M.IMG") et calcul de profils d'horizon.
 * Format (d'après le label PDS) : 7600 × 7600 entiers 16 bits little-endian, hauteur = DN × 0,5 m
 * par rapport à la sphère de 1737,4 km ; projection stéréographique polaire sphérique, vraie au pôle,
 * 80 m/pixel, pôle au pixel (3799,5 ; 3799,5) en indices 0-based ; repère Mean Earth / polar axis.
 */
import { readFileSync } from 'node:fs';

const DEG = Math.PI / 180;
export const R_M = 1_737_400;

export type Orientation = { swap: boolean; sx: 1 | -1; sy: 1 | -1 };

export class Dem {
  readonly n = 7600;
  readonly pixelM = 80;
  readonly center = 3799.5;
  private data: Int16Array;
  constructor(path: string, public orient: Orientation) {
    const b = readFileSync(path);
    if (b.length !== this.n * this.n * 2) throw new Error(`Taille inattendue ${b.length} (attendu ${this.n * this.n * 2}) : téléchargement incomplet ?`);
    // LSB_INTEGER : little-endian
    this.data = new Int16Array(b.buffer, b.byteOffset, this.n * this.n);
    if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) throw new Error('Plateforme big-endian non gérée');
  }

  /** (lat°, lon°E) -> (colonne, ligne) fractionnaires. Latitude < -80 requise. */
  project(latDeg: number, lonDeg: number): [number, number] {
    const colat = (latDeg + 90) * DEG;
    const rho = (2 * R_M * Math.tan(colat / 2)) / this.pixelM; // en pixels
    const lo = lonDeg * DEG;
    const u = rho * Math.cos(lo), v = rho * Math.sin(lo);
    const [a, b] = this.orient.swap ? [v, u] : [u, v];
    return [this.center + this.orient.sx * a, this.center + this.orient.sy * b];
  }

  /** Inverse de project : (colonne, ligne) -> (lat, lon). */
  unproject(col: number, row: number): [number, number] {
    const a = (col - this.center) * this.orient.sx, b = (row - this.center) * this.orient.sy;
    const [u, v] = this.orient.swap ? [b, a] : [a, b];
    const rho = Math.hypot(u, v) * this.pixelM;
    const colat = 2 * Math.atan(rho / (2 * R_M));
    return [colat / DEG - 90, ((Math.atan2(v, u) / DEG) + 540) % 360 - 180];
  }

  at(col: number, row: number): number { return this.data[row * this.n + col] * 0.5; }

  inside(col: number, row: number): boolean { return col >= 0 && row >= 0 && col <= this.n - 1.001 && row <= this.n - 1.001; }

  /** Hauteur (m, vs sphère 1737,4 km) par interpolation bilinéaire ; null hors du DEM. */
  height(latDeg: number, lonDeg: number): number | null {
    if (latDeg > -80) return null;
    const [c, r] = this.project(latDeg, lonDeg);
    if (!this.inside(c, r)) return null;
    const c0 = Math.floor(c), r0 = Math.floor(r), fc = c - c0, fr = r - r0;
    return (
      this.at(c0, r0) * (1 - fc) * (1 - fr) + this.at(c0 + 1, r0) * fc * (1 - fr) +
      this.at(c0, r0 + 1) * (1 - fc) * fr + this.at(c0 + 1, r0 + 1) * fc * fr
    );
  }

  /** Pente locale (°) par différences centrées sur ±1 pixel (base ≈ 160 m : dépend de la résolution). */
  slopeDeg(latDeg: number, lonDeg: number): number | null {
    const [c, r] = this.project(latDeg, lonDeg);
    const ci = Math.round(c), ri = Math.round(r);
    if (!this.inside(ci - 1, ri - 1) || !this.inside(ci + 1, ri + 1)) return null;
    const dzdx = (this.at(ci + 1, ri) - this.at(ci - 1, ri)) / (2 * this.pixelM);
    const dzdy = (this.at(ci, ri + 1) - this.at(ci, ri - 1)) / (2 * this.pixelM);
    return Math.atan(Math.hypot(dzdx, dzdy)) / DEG;
  }
}

export interface HorizonResult {
  /** Élévation de l'horizon (°) pour chaque azimut entier 0..359 (depuis le Nord, vers l'Est). */
  elevationDeg: number[];
  /** Distance (km) jusqu'où le DEM a pu être lu, par azimut (limitée par le bord du DEM, 80°S). */
  rangeKm: number[];
}

/** Point atteint depuis (lat,lon) par le relèvement `az` à la distance angulaire `theta` (sphère). */
function destination(lat: number, lon: number, az: number, theta: number): [number, number] {
  const la = lat * DEG, lo = lon * DEG, a = az * DEG;
  const lat2 = Math.asin(Math.sin(la) * Math.cos(theta) + Math.cos(la) * Math.sin(theta) * Math.cos(a));
  const lon2 = lo + Math.atan2(Math.sin(a) * Math.sin(theta) * Math.cos(la), Math.cos(theta) - Math.sin(la) * Math.sin(lat2));
  return [lat2 / DEG, ((lon2 / DEG + 540) % 360) - 180];
}

/**
 * Profil d'horizon depuis un site : pour chaque azimut, plus grand angle d'élévation
 * (géométrie sphérique : la courbure de la Lune est incluse) des points du DEM jusqu'à `maxRangeKm`.
 */
export function horizonProfile(dem: Dem, latDeg: number, lonDeg: number, h0: number, maxRangeKm = 200, observerHeightM = 0): HorizonResult {
  const lat = Math.max(latDeg, -89.9999999);
  const step = dem.pixelM; // m
  const nSteps = Math.floor((maxRangeKm * 1000) / step);
  const elevationDeg: number[] = [], rangeKm: number[] = [];
  const r0 = R_M + h0 + observerHeightM;
  for (let az = 0; az < 360; az++) {
    let best = -90, reached = 0;
    for (let i = 1; i <= nSteps; i++) {
      const theta = (i * step) / R_M;
      const [la, lo] = destination(lat, lonDeg, az, theta);
      const h = dem.height(la, lo);
      if (h === null) break;
      reached = i * step;
      const rt = R_M + h;
      const el = Math.atan2(rt * Math.cos(theta) - r0, rt * Math.sin(theta)) / DEG;
      if (el > best) best = el;
    }
    elevationDeg.push(Math.round(best * 100) / 100);
    rangeKm.push(Math.round(reached / 100) / 10);
  }
  return { elevationDeg, rangeKm };
}
