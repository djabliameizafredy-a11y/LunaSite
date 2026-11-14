/**
 * Import LOLA : calcule, pour chaque site couvert par le DEM polaire 80°S–90°S, la hauteur,
 * la pente locale et le profil d'horizon (360 azimuts), et écrit src/data/horizons.json.
 *
 * Usage : tsx scripts/import-lola.ts <ldem_80s_80m.img> --orient <swap|noswap>,<sx>,<sy> [--max-range-km 200]
 * (l'orientation se détermine avec scripts/probe-orientation.ts)
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Dem, horizonProfile, type Orientation } from './lola';
import { SITES } from '../src/data/sites';

const args = process.argv.slice(2);
const file = args[0];
const opt = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
if (!file || !opt('--orient')) throw new Error('usage: import-lola.ts <ldem_80s_80m.img> --orient swap|noswap,1|-1,1|-1 [--max-range-km N]');
const [sw, sx, sy] = opt('--orient')!.split(',');
const orient: Orientation = { swap: sw === 'swap', sx: Number(sx) as 1 | -1, sy: Number(sy) as 1 | -1 };
const maxRangeKm = Number(opt('--max-range-km') ?? 200);

const dem = new Dem(file, orient);
const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex');

const out: Record<string, unknown> = {};
for (const s of SITES) {
  // Marge de 0,5° : sous 80,5°S le DEM ne couvre qu'une fraction de la portée visée.
  if (s.latitude > -80.5) continue;
  const h0 = dem.height(s.latitude, s.longitude);
  if (h0 === null) continue;
  const prof = horizonProfile(dem, s.latitude, s.longitude, h0, maxRangeKm);
  const st = dem.localStats(s.latitude, s.longitude, 250);
  out[s.id] = {
    elevationM: Math.round(h0),
    // Disque de 250 m de rayon (≈ zone d'atterrissage) ; null si le disque sort du DEM.
    slopeDeg: st ? Math.round(st.meanSlopeDeg * 10) / 10 : null,
    maxSlopeDeg: st ? Math.round(st.maxSlopeDeg * 10) / 10 : null,
    localReliefM: st ? Math.round(st.reliefM) : null,
    horizonElevationDeg: prof.elevationDeg,
    minRangeKm: Math.min(...prof.rangeKm),
    maxHorizonDeg: Math.max(...prof.elevationDeg),
  };
  console.log(`${s.id.padEnd(18)} h=${Math.round(h0)} m  pente moy=${(out[s.id] as { slopeDeg: number }).slopeDeg}° relief=${(out[s.id] as { localReliefM: number }).localReliefM} m  horizon max=${Math.max(...prof.elevationDeg)}°  portée min=${Math.min(...prof.rangeKm)} km`);
}

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(
  join(here, '../src/data/horizons.json'),
  JSON.stringify({
    meta: {
      dataset: 'LRO-L-LOLA-4-GDR-V1.0',
      product: 'LDEM_80S_80M.IMG (PDS Geosciences Node, produit V2.0 du 2017-06-15)',
      url: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.img',
      resolutionM: 80,
      referenceRadiusM: 1_737_400,
      sha256,
      orientation: orient,
      azimuthStepDeg: 1,
      maxRangeKm,
      observerHeightM: 0,
      generatedAt: new Date().toISOString(),
      notes: [
        "Horizon = plus grand angle d'élévation des pixels du DEM jusqu'à maxRangeKm, courbure lunaire incluse.",
        "Le DEM s'arrête à 80°S : près de ce bord, la portée est plus courte (minRangeKm) et l'horizon peut être sous-estimé.",
        "Résolution 80 m : les petits obstacles (rochers, cratères < 200 m) ne sont pas représentés ; ~90 % des pixels polaires sont interpolés entre traces laser.",
        "Pente moyenne et relief local sur un disque de 250 m de rayon, pente par différences centrées sur ±80 m : dépend de la résolution du DEM ; cailloux et petits cratères non vus.",
      ],
    },
    sites: out,
  }),
);
console.log('écrit src/data/horizons.json');
