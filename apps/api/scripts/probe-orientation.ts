/**
 * Détermine empiriquement l'orientation des axes du DEM : l'orientation correcte place de vrais
 * cratères (profondeur > 0) aux positions connues. Usage : tsx scripts/probe-orientation.ts <ldem_80s_80m.img>
 */
import { Dem, type Orientation } from './lola';

const path = process.argv[2];
if (!path) throw new Error('usage: probe-orientation.ts <fichier.img>');

// [nom, lat, lon, rayon km (ordre de grandeur), attendu: 'cratère' | 'relief']
const REF: Array<[string, number, number, number, 'crater' | 'high']> = [
  ['Cabeus', -84.9, -35.5, 50, 'crater'],
  ['Amundsen', -84.5, 82.8, 52, 'crater'],
  ['Faustini', -87.3, 77.0, 20, 'crater'],
  ['de Gerlache', -88.5, -87.1, 16, 'crater'],
  ['Haworth', -87.5, -5.0, 25, 'crater'],
  ['Shackleton', -89.9, 129.78, 10, 'crater'],
];

const variants: Orientation[] = [];
for (const swap of [false, true]) for (const sx of [1, -1] as const) for (const sy of [1, -1] as const) variants.push({ swap, sx, sy });

for (const o of variants) {
  const dem = new Dem(path, o);
  const row: string[] = [];
  let ok = 0;
  for (const [name, lat, lon, r] of REF) {
    const c = dem.height(lat, lon);
    const ring: number[] = [];
    for (let k = 0; k < 16; k++) {
      const az = (k * 22.5 * Math.PI) / 180;
      // point à 1,4 r : conversion approximative km -> degrés de latitude/longitude via projection locale
      const dLat = (1.4 * r * Math.cos(az)) / 30.32;
      const dLon = (1.4 * r * Math.sin(az)) / (30.32 * Math.max(0.02, Math.cos((lat * Math.PI) / 180)));
      const h = dem.height(lat + dLat, lon + dLon);
      if (h !== null) ring.push(h);
    }
    if (c === null || ring.length < 8) { row.push(`${name}:n/a`); continue; }
    const depth = ring.reduce((a, b) => a + b, 0) / ring.length - c;
    if (depth > 500) ok++;
    row.push(`${name}:${Math.round(depth)}m`);
  }
  console.log(`swap=${o.swap} sx=${o.sx} sy=${o.sy}  cratères détectés ${ok}/${REF.length} | ${row.join('  ')}`);
}
