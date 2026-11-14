/**
 * Seed : copie le catalogue embarqué (src/data/sites.ts) et le relief LOLA (src/data/horizons.json) dans PostgreSQL.
 * Idempotent (upsert). Les données ne sont PAS des données de démonstration : is_mock = false.
 * Usage : npm run db:seed
 */
import 'dotenv/config';
import { SITES } from '../src/data/sites';
import { EMBEDDED_TERRAIN } from '../src/data/terrain';
import { closePrisma, getPrisma } from '../src/db/client';

const LOLA_ID = 'lola-ldem-80s-80m';
const EPHEMERIS_ID = 'astronomy-engine-ephemeris';

async function main() {
  const db = getPrisma();
  const meta = EMBEDDED_TERRAIN.meta;
  if (!meta) throw new Error('horizons.json sans meta : lancer scripts/import-lola.ts avant le seed');

  await db.nasaDataset.upsert({
    where: { id: LOLA_ID },
    create: {
      id: LOLA_ID, name: meta.product, provider: `NASA PDS Geosciences Node — ${meta.dataset}`, url: meta.url,
      version: 'V2.0 (2017-06-15)', sha256: meta.sha256, importedAt: new Date(meta.generatedAt),
      notes: { resolutionM: meta.resolutionM, maxRangeKm: meta.maxRangeKm, product: meta.product, generatedAt: meta.generatedAt, notes: meta.notes },
    },
    update: {
      name: meta.product, url: meta.url, sha256: meta.sha256, importedAt: new Date(meta.generatedAt),
      notes: { resolutionM: meta.resolutionM, maxRangeKm: meta.maxRangeKm, product: meta.product, generatedAt: meta.generatedAt, notes: meta.notes },
    },
  });
  await db.nasaDataset.upsert({
    where: { id: EPHEMERIS_ID },
    create: {
      id: EPHEMERIS_ID, name: 'Éphémérides Soleil/Lune (astronomy-engine) + rotation lunaire IAU', provider: 'astronomy-engine / IAU (Archinal et al.)',
      version: '2.1.x', importedAt: new Date(), notes: { note: 'Bibliothèque de calcul, pas un fichier de données ; sans SPICE ni Horizons.' },
    },
    update: {},
  });

  for (const s of SITES) {
    const data = {
      name: s.name, region: s.region, latitude: s.latitude, longitude: s.longitude, elevation: s.elevationM,
      terrainType: s.terrainType, description: s.description, origin: s.origin,
      coordinatesStatus: s.coordinatesStatus, coordinatesSource: s.coordinatesSource, isMock: false,
    };
    await db.landingSite.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
  }

  let terrain = 0;
  for (const [siteId, t] of Object.entries(EMBEDDED_TERRAIN.sites)) {
    const data = {
      elevation: t.elevationM, slope: t.slopeDeg, maxSlope: t.maxSlopeDeg, localRelief: t.localReliefM,
      horizonElevationDeg: t.horizonElevationDeg, maxHorizonDeg: t.maxHorizonDeg, minRangeKm: t.minRangeKm,
      maxRangeKm: meta.maxRangeKm, shadowRisk: null, isMock: false,
    };
    await db.terrainData.upsert({
      where: { siteId_datasetId: { siteId, datasetId: LOLA_ID } },
      create: { siteId, datasetId: LOLA_ID, ...data }, update: data,
    });
    terrain++;
  }
  console.log(`seed OK : ${SITES.length} sites, ${terrain} relevés de terrain, 2 jeux de données`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(closePrisma);
