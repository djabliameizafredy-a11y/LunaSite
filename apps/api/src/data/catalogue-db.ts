import type { Site } from '@lunasite/shared-types';
import { getPrisma } from '../db/client';
import { replaceCatalogue } from './sites';
import { setTerrain, type HorizonFile } from './terrain';

/**
 * Charge le catalogue et le relief depuis PostgreSQL dans les structures en mémoire utilisées par le moteur
 * (le moteur de calcul reste synchrone). Lève une erreur si la base est vide ou inaccessible :
 * l'appelant décide du repli (catalogue embarqué), il n'est jamais silencieux.
 */
export async function hydrateCatalogueFromDb(): Promise<{ sites: number; terrain: number }> {
  const db = getPrisma();
  const [rows, terrainRows] = await Promise.all([
    db.landingSite.findMany({ orderBy: [{ region: 'asc' }, { name: 'asc' }] }),
    db.terrainData.findMany({ include: { dataset: true } }),
  ]);
  if (!rows.length) throw new Error('table landing_sites vide : lancer `npm run db:seed`');

  const byId = new Map(terrainRows.map((t) => [t.siteId, t]));
  const sites: Site[] = rows.map((r) => {
    const t = byId.get(r.id);
    return {
      id: r.id, name: r.name, region: r.region, latitude: r.latitude, longitude: r.longitude, elevationM: r.elevation,
      terrainType: r.terrainType, description: r.description, origin: r.origin, coordinatesStatus: r.coordinatesStatus,
      coordinatesSource: r.coordinatesSource,
      terrain: { slopeDeg: t?.slope ?? null, localReliefM: t?.localRelief ?? null, shadowRisk: t?.shadowRisk ?? null, horizonMask: Boolean(t?.horizonElevationDeg) },
    };
  });

  const file: HorizonFile = { meta: null, sites: {} };
  for (const t of terrainRows) {
    if (!Array.isArray(t.horizonElevationDeg)) continue;
    const n = t.dataset.notes as { resolutionM: number; maxRangeKm: number; product: string; generatedAt: string; notes: string[] };
    file.meta ??= {
      dataset: t.dataset.provider.split('— ')[1] ?? t.dataset.provider, product: n.product, url: t.dataset.url ?? '', resolutionM: n.resolutionM,
      sha256: t.dataset.sha256 ?? '', maxRangeKm: n.maxRangeKm, generatedAt: n.generatedAt, notes: n.notes,
    };
    file.sites[t.siteId] = {
      elevationM: t.elevation ?? 0, slopeDeg: t.slope, maxSlopeDeg: t.maxSlope, localReliefM: t.localRelief,
      horizonElevationDeg: t.horizonElevationDeg as number[], minRangeKm: t.minRangeKm ?? 0, maxHorizonDeg: t.maxHorizonDeg ?? 0,
    };
  }
  setTerrain(file);
  replaceCatalogue(sites);
  return { sites: sites.length, terrain: Object.keys(file.sites).length };
}
