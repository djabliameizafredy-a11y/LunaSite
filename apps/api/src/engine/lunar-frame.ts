/**
 * Orientation de la Lune (repère "Mean Earth / polar axis", ME) selon le modèle
 * de rotation IAU (Archinal et al. 2011, mise à jour 2018) : α0, δ0, W avec les
 * arguments E1..E13. Précision ~ quelques centièmes de degré (insuffisant pour
 * de la navigation, largement suffisant pour de la planification).
 *
 * Convention : repère inertiel = EQJ (J2000 équatorial) d'astronomy-engine.
 */
import * as Astronomy from 'astronomy-engine';

const DEG = Math.PI / 180;

export type Vec3 = [number, number, number];

export const MOON_RADIUS_KM = 1737.4; // sphère de référence IAU
export const AU_KM = 149597870.7;

/** Jours depuis J2000.0 (TT approximé par UT : écart ~69 s, < 0,001° de rotation lunaire). */
function daysSinceJ2000(date: Date): number {
  return Astronomy.MakeTime(date).tt;
}

export function moonOrientation(date: Date): { alpha0: number; delta0: number; w: number } {
  const d = daysSinceJ2000(date);
  const T = d / 36525;
  const E = [
    125.045 - 0.0529921 * d,
    250.089 - 0.1059842 * d,
    260.008 + 13.012 * d,
    176.625 + 13.3407154 * d,
    357.529 + 0.9856993 * d,
    311.589 + 26.4057084 * d,
    134.963 + 13.064993 * d,
    276.617 + 0.3287146 * d,
    34.226 + 1.7484877 * d,
    15.134 - 0.1589763 * d,
    119.743 + 0.0036096 * d,
    239.961 + 0.1643573 * d,
    25.053 + 12.9590088 * d,
  ].map((x) => x * DEG);
  const s = (n: number) => Math.sin(E[n - 1]);
  const c = (n: number) => Math.cos(E[n - 1]);

  const alpha0 =
    269.9949 + 0.0031 * T - 3.8787 * s(1) - 0.1204 * s(2) + 0.07 * s(3) - 0.0172 * s(4) +
    0.0072 * s(6) - 0.0052 * s(10) + 0.0043 * s(13);
  const delta0 =
    66.5392 + 0.013 * T + 1.5419 * c(1) + 0.0239 * c(2) - 0.0278 * c(3) + 0.0068 * c(4) -
    0.0029 * c(6) + 0.0009 * c(7) + 0.0008 * c(10) - 0.0009 * c(13);
  const w =
    38.3213 + 13.17635815 * d - 1.4e-12 * d * d + 3.561 * s(1) + 0.1208 * s(2) - 0.0642 * s(3) +
    0.0158 * s(4) + 0.0252 * s(5) - 0.0066 * s(6) - 0.0047 * s(7) - 0.0046 * s(8) +
    0.0028 * s(9) + 0.0052 * s(10) + 0.004 * s(11) + 0.0019 * s(12) - 0.0044 * s(13);
  return { alpha0, delta0, w };
}

type Mat3 = [Vec3, Vec3, Vec3];

/** Matrice EQJ -> repère lunaire fixe : Rz(W) · Rx(90°-δ0) · Rz(90°+α0). */
export function eqjToMoonFixed(date: Date): Mat3 {
  const { alpha0, delta0, w } = moonOrientation(date);
  const a = (90 + alpha0) * DEG;
  const b = (90 - delta0) * DEG;
  const g = w * DEG;
  const rz = (t: number): Mat3 => [
    [Math.cos(t), Math.sin(t), 0],
    [-Math.sin(t), Math.cos(t), 0],
    [0, 0, 1],
  ];
  const rx = (t: number): Mat3 => [
    [1, 0, 0],
    [0, Math.cos(t), Math.sin(t)],
    [0, -Math.sin(t), Math.cos(t)],
  ];
  const mul = (A: Mat3, B: Mat3): Mat3 =>
    A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j])) as Mat3;
  return mul(rz(g), mul(rx(b), rz(a)));
}

export function apply(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

export interface BodyState {
  /** Vecteur Lune -> Soleil dans le repère lunaire fixe, km. */
  sunMoonFixed: Vec3;
  /** Vecteur Lune -> Terre dans le repère lunaire fixe, km. */
  earthMoonFixed: Vec3;
  sunDistanceAu: number;
}

/** États des corps à un instant (partagés par tous les sites : calcul fait une seule fois). */
export function bodyState(date: Date): BodyState {
  const au2km = AU_KM;
  const moonGeo = Astronomy.GeoMoon(date); // Terre -> Lune, AU, EQJ
  const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, date, false); // Terre -> Soleil, AU
  const sunFromMoon: Vec3 = [
    (sunGeo.x - moonGeo.x) * au2km,
    (sunGeo.y - moonGeo.y) * au2km,
    (sunGeo.z - moonGeo.z) * au2km,
  ];
  const earthFromMoon: Vec3 = [-moonGeo.x * au2km, -moonGeo.y * au2km, -moonGeo.z * au2km];
  const R = eqjToMoonFixed(date);
  const sunMoonFixed = apply(R, sunFromMoon);
  return {
    sunMoonFixed,
    earthMoonFixed: apply(R, earthFromMoon),
    sunDistanceAu: Math.hypot(...sunMoonFixed) / au2km,
  };
}
