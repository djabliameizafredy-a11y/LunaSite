import { getPrisma } from '../db/client';
import type { ReferenceBody } from '../modules/validation/horizons';
import { setReference, type ReferenceFile, type ReferenceMeta } from './reference';

const DATASET_ID = 'jpl-horizons-observer';

/**
 * Charge les références JPL Horizons depuis PostgreSQL. Renvoie le nombre de points ; 0 = rien en base
 * (l'appelant garde alors le fichier embarqué : le repli est explicite, jamais silencieux).
 */
export async function hydrateReferenceFromDb(): Promise<number> {
  const db = getPrisma();
  const [dataset, rows] = await Promise.all([
    db.nasaDataset.findUnique({ where: { id: DATASET_ID } }),
    db.referenceEphemeris.findMany({ where: { datasetId: DATASET_ID }, orderBy: { tUtc: 'asc' } }),
  ]);
  if (!dataset || !rows.length) return 0;

  const file: ReferenceFile = { meta: null, sites: {} };
  for (const r of rows) {
    const site = (file.sites[r.siteId] ??= {});
    (site[r.body as ReferenceBody] ??= []).push({ t: r.tUtc.toISOString(), azimuthDeg: r.azimuthDeg, elevationDeg: r.elevationDeg });
  }
  const n = (dataset.notes ?? {}) as Partial<{ start: string; stop: string; step: string; apiVersion: string; centerFrame: string }>;
  const meta: ReferenceMeta = {
    datasetId: dataset.id, source: `${dataset.provider} (${dataset.url ?? ''})`, apiVersion: n.apiVersion ?? '', ephemeris: 'DE441',
    centerFrame: n.centerFrame ?? '', fetchedAt: dataset.importedAt.toISOString(), start: n.start ?? '', stop: n.stop ?? '', step: n.step ?? '',
    sha256: dataset.sha256 ?? '',
  };
  file.meta = meta;
  setReference(file, 'database');
  return rows.length;
}
