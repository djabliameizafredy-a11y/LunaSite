/**
 * Import des positions de référence Soleil / Terre depuis JPL Horizons, pour chaque site du catalogue.
 *
 *   npm run data:horizons                         # 1 an à partir d'aujourd'hui, pas de 1 jour
 *   npm run data:horizons -- --start 2026-11-14 --stop 2027-11-14 --step "1 d"
 *
 * Écrit src/data/horizons-reference.json (repli embarqué, versionné) et, si DATABASE_URL est définie,
 * remplace les lignes de ce jeu dans reference_ephemerides + l'enregistre dans nasa_datasets (idempotent).
 * Appels séquentiels avec une pause : Horizons est un service public partagé.
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES } from '../src/data/sites';
import { fetchHorizons, HORIZONS_API, HORIZONS_API_VERSION, type ReferenceBody } from '../src/modules/validation/horizons';
import { compareWithHorizons } from '../src/modules/validation/compare';
import type { ReferenceFile } from '../src/data/reference';

const DATASET_ID = 'jpl-horizons-observer';
const BODIES: ReferenceBody[] = ['sun', 'earth'];
const PAUSE_MS = 700;

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const today = new Date().toISOString().slice(0, 10);
const inAYear = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);
const start = arg('start', today);
const stop = arg('stop', inAYear);
const step = arg('step', '1 d');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const file: ReferenceFile = { meta: null, sites: {} };
  console.log(`JPL Horizons : ${SITES.length} sites × ${BODIES.length} corps, ${start} → ${stop}, pas « ${step} »`);

  for (const site of SITES) {
    file.sites[site.id] = {};
    for (const body of BODIES) {
      const points = await fetchHorizons(body, site, start, stop, step);
      file.sites[site.id][body] = points;
      // Écarts attendus : ≤ 0,003° sur les sites polaires. Apollo 11 et Blue Ghost (latitudes basses, Soleil
      // proche du zénith) montrent 0,02–0,22° en AZIMUT seulement : près du zénith, une infime différence de
      // position fait tourner fortement l'azimut (géométrie, pas une erreur). L'élévation reste ≤ 0,003°.
      const c = compareWithHorizons(site, body, points);
      console.log(`  ${site.id.padEnd(16)} ${body.padEnd(5)} ${String(points.length).padStart(4)} pts · écart élévation max ${c.maxAbsElevationDiffDeg}° · azimut max ${c.maxAbsAzimuthDiffDeg}°`);
      await sleep(PAUSE_MS);
    }
  }

  const sha256 = createHash('sha256').update(JSON.stringify(file.sites)).digest('hex');
  file.meta = {
    datasetId: DATASET_ID, source: `NASA/JPL Horizons API (${HORIZONS_API})`, apiVersion: HORIZONS_API_VERSION,
    ephemeris: 'DE441', centerFrame: 'MEAN_ME (Moon, coord@301, GEODETIC)', fetchedAt: new Date().toISOString(),
    start, stop, step, sha256,
  };
  const out = join(dirname(fileURLToPath(import.meta.url)), '../src/data/horizons-reference.json');
  writeFileSync(out, `${JSON.stringify(file, null, 1)}\n`);
  console.log(`écrit ${out} (sha256 ${sha256.slice(0, 12)}…)`);

  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL non définie : base non mise à jour (fichier embarqué seulement).');
    return;
  }
  const { getPrisma, closePrisma } = await import('../src/db/client');
  const db = getPrisma();
  try {
    const rows = Object.entries(file.sites).flatMap(([siteId, bodies]) =>
      (Object.entries(bodies) as [ReferenceBody, { t: string; azimuthDeg: number; elevationDeg: number }[]][])
        .flatMap(([body, pts]) => pts.map((p) => ({
          siteId, datasetId: DATASET_ID, body, tUtc: new Date(p.t),
          azimuthDeg: ((p.azimuthDeg % 360) + 360) % 360, elevationDeg: p.elevationDeg,
        }))));
    const notes = { start, stop, step, apiVersion: HORIZONS_API_VERSION, centerFrame: file.meta.centerFrame, quantities: '4 (airless apparent AZ/EL)' };
    // Transaction interactive : requêtes strictement séquentielles sur la connexion. Le mode « tableau »
    // les enchaînait sans attendre via l'adaptateur pg (DeprecationWarning « client is already executing a query »,
    // erreur en pg@9).
    const meta = file.meta;
    await db.$transaction(async (tx) => {
      await tx.nasaDataset.upsert({
        where: { id: DATASET_ID },
        create: { id: DATASET_ID, name: 'Éphémérides observateur Soleil/Terre depuis les sites (JPL Horizons)', provider: 'NASA/JPL Solar System Dynamics — Horizons',
          url: HORIZONS_API, version: `API ${HORIZONS_API_VERSION} · DE441 · ${meta.fetchedAt.slice(0, 10)}`, sha256, importedAt: new Date(meta.fetchedAt), notes },
        update: { version: `API ${HORIZONS_API_VERSION} · DE441 · ${meta.fetchedAt.slice(0, 10)}`, sha256, importedAt: new Date(meta.fetchedAt), notes },
      });
      await tx.referenceEphemeris.deleteMany({ where: { datasetId: DATASET_ID } });
      for (let i = 0; i < rows.length; i += 2000) {
        await tx.referenceEphemeris.createMany({ data: rows.slice(i, i + 2000) });
      }
    }, { timeout: 120_000, maxWait: 20_000 });
    console.log(`base : ${rows.length} points de référence (jeu ${DATASET_ID}, remplacé)`);
  } finally {
    await closePrisma();
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; });
