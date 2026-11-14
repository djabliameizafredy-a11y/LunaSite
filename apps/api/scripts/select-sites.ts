/**
 * Sélection de points d'atterrissage "de crête" dans le DEM LOLA.
 * Pour chaque caractéristique (cratère/massif), cherche dans un disque autour d'un centre APPROXIMATIF le point
 * qui maximise 0,533·éclairement + 0,467·visibilité Terre (poids du score global, renormalisés sans terrain),
 * sur 1 an, sous la contrainte de pente moyenne (disque de 250 m) <= SLOPE_MAX_DEG.
 * Ce n'est PAS un site officiel : c'est un point candidat reproductible. Usage : tsx scripts/select-sites.ts <dem.img>
 */
import { writeFileSync } from 'node:fs';
import { Dem, destination, horizonProfile } from './lola';
import { maskFromUniform } from '../src/engine/geometry';
import { buildGrid, earthSeries, sunSeries, visibleHours } from '../src/engine/series';

const SLOPE_MAX_DEG = 10;       // seuil illustratif d'équipe
const AZ_STEP = 3, RANGE_KM = 100;
const W_SUN = 0.4 / 0.75, W_EARTH = 0.35 / 0.75;

// Centres APPROXIMATIFS (mémoire d'équipe) et zone de recherche en anneau [inKm, outKm] autour du centre :
// autour du rayon du cratère (~0,7 à 1,4 R) pour couvrir le bord malgré l'incertitude sur le centre.
const FEATURES: Array<{ id: string; lat: number; lon: number; inKm: number; outKm: number }> = [
  { id: 'shackleton', lat: -89.9, lon: 129.78, inKm: 0, outKm: 14 },      // R ~ 10,5 km ; inclut la crête vers de Gerlache
  { id: 'haworth', lat: -87.5, lon: -5.0, inKm: 17, outKm: 35 },          // R ~ 25 km
  { id: 'malapert', lat: -85.9, lon: 0.1, inKm: 0, outKm: 12 },           // massif (pas un cratère)
  { id: 'cabeus', lat: -84.9, lon: -35.5, inKm: 35, outKm: 70 },          // R ~ 50 km
  { id: 'de-gerlache', lat: -88.5, lon: -87.1, inKm: 11, outKm: 22 },     // R ~ 16 km
  { id: 'nobile', lat: -85.2, lon: 53.3, inKm: 25, outKm: 46 },           // R ~ 36 km
  { id: 'faustini', lat: -87.3, lon: 77.0, inKm: 14, outKm: 27 },         // R ~ 20 km
];

const dem = new Dem(process.argv[2], { swap: true, sx: 1, sy: -1 });
const grid = buildGrid(new Date('2027-01-01T00:00:00Z'), new Date('2028-01-01T00:00:00Z'), 360); // 1 an, pas 6 h
const total = grid.times.length;
const result: Record<string, unknown> = {};

for (const f of FEATURES) {
  const cands: Array<{ lat: number; lon: number; h: number; slope: number; relief: number; sun: number; earth: number; obj: number }> = [];
  const step = f.outKm <= 20 ? 1 : 2; // km ; pas plus gros pour les grands cratères (budget de calcul)
  for (let dx = -f.outKm; dx <= f.outKm; dx += step) for (let dy = -f.outKm; dy <= f.outKm; dy += step) {
    const d = Math.hypot(dx, dy);
    if (d > f.outKm || d < f.inKm) continue;
    const bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
    const [lat, lon] = d === 0 ? [f.lat, f.lon] : destination(f.lat, f.lon, bearing, (d * 1000) / 1_737_400);
    if (lat > -80.7) continue;
    const h = dem.height(lat, lon), st = dem.localStats(lat, lon, 250);
    if (h === null || !st || st.meanSlopeDeg > SLOPE_MAX_DEG) continue;
    const prof = horizonProfile(dem, lat, lon, h, RANGE_KM, 0, AZ_STEP);
    const mask = maskFromUniform(prof.elevationDeg.filter((_, i) => i % 1 === 0));
    const site = { latitude: lat, longitude: lon, elevationM: h, horizon: mask };
    const sun = visibleHours(grid, sunSeries(grid, site)) / (total * 6);
    const earth = visibleHours(grid, earthSeries(grid, site)) / (total * 6);
    cands.push({ lat, lon, h, slope: st.meanSlopeDeg, relief: st.reliefM, sun, earth, obj: W_SUN * sun + W_EARTH * earth });
  }
  cands.sort((a, b) => b.obj - a.obj);
  result[f.id] = cands.slice(0, 5);
  const b = cands[0];
  console.log(`${f.id.padEnd(12)} ${cands.length} candidats | meilleur lat ${b?.lat.toFixed(3)} lon ${b?.lon.toFixed(3)} h=${b?.h.toFixed(0)} m pente=${b?.slope.toFixed(1)}° relief=${b?.relief.toFixed(0)} m Soleil=${(b?.sun*100).toFixed(0)}% Terre=${(b?.earth*100).toFixed(0)}%`);
}
writeFileSync(new URL('../../../data/lola/selection.json', import.meta.url), JSON.stringify({ criteria: { SLOPE_MAX_DEG, stepKm: '1 (zones <= 20 km) ou 2', AZ_STEP, RANGE_KM, period: '2027-01-01..2028-01-01', stepHours: 6, weights: { sun: W_SUN, earth: W_EARTH } }, top5: result }, null, 1));
