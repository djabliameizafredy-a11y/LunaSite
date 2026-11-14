import 'dotenv/config';
import { describe, it, expect, afterAll } from 'vitest';
import { closePrisma, dbEnabled, getPrisma } from '../src/db/client';
import { SITES } from '../src/data/sites';
import { EMBEDDED_TERRAIN } from '../src/data/terrain';

// Tests d'intégration : exigent PostgreSQL migré et seedé (npm run db:up && npm run db:migrate && npm run db:seed).
// Sans DATABASE_URL ils sont IGNORÉS (et non « réussis ») : le rapport vitest affiche « skipped ».
describe.skipIf(!dbEnabled())('PostgreSQL (intégration)', () => {
  afterAll(closePrisma);

  it('le seed reflète le catalogue embarqué, sans doublon', async () => {
    const db = getPrisma();
    expect(await db.landingSite.count()).toBe(SITES.length);
    expect(await db.terrainData.count()).toBe(Object.keys(EMBEDDED_TERRAIN.sites).length);
  });

  it("valeur inconnue = NULL, jamais 0 : un site sans relief n'a pas de ligne terrain_data, shadow_risk reste NULL", async () => {
    const db = getPrisma();
    expect(await db.terrainData.count({ where: { siteId: 'apollo11' } })).toBe(0);
    expect(await db.terrainData.count({ where: { shadowRisk: { not: null } } })).toBe(0);
    const apollo = await db.landingSite.findUniqueOrThrow({ where: { id: 'apollo11' } });
    expect(apollo.elevation).toBeNull();
  });

  it('traçabilité : le relevé de terrain pointe vers le jeu de données LOLA avec son empreinte sha256', async () => {
    const t = await getPrisma().terrainData.findFirstOrThrow({ include: { dataset: true } });
    expect(t.dataset.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(t.dataset.provider).toMatch(/LOLA/);
    expect(Array.isArray(t.horizonElevationDeg) && (t.horizonElevationDeg as number[]).length).toBe(360);
  });

  it('les tables de résultats imposent la clé de cache (site + période + méthode)', async () => {
    const db = getPrisma();
    const base = {
      siteId: 'malapert', startDate: new Date('2030-01-01T00:00:00Z'), endDate: new Date('2030-01-02T00:00:00Z'),
      stepMinutes: 15, methodVersion: 'test-dup', calculationLevel: 'simplified' as const,
    };
    await db.missionWindow.deleteMany({ where: { methodVersion: 'test-dup' } });
    await db.missionWindow.create({ data: base });
    await expect(db.missionWindow.create({ data: base })).rejects.toThrow();
    await db.missionWindow.deleteMany({ where: { methodVersion: 'test-dup' } });
  });
});
