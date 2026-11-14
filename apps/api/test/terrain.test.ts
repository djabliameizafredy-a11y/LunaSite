import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { maskFromUniform } from '../src/engine/geometry';
import { SITES, SITES_BY_ID } from '../src/data/sites';
import { TERRAIN_META, terrainInfo } from '../src/data/terrain';
import { earthAnalysis, makePeriod, solarAnalysis } from '../src/modules/solar/analysis';

const p = makePeriod(new Date('2026-11-14T00:00:00Z'), 30, 60);
const flat = (id: string) => ({ ...SITES_BY_ID.get(id)!, terrain: { ...SITES_BY_ID.get(id)!.terrain, horizonMask: false } });

describe('import LOLA : intégrité des données', () => {
  it('traçabilité : jeu de données, version, empreinte, résolution', () => {
    expect(TERRAIN_META?.dataset).toBe('LRO-L-LOLA-4-GDR-V1.0');
    expect(TERRAIN_META?.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(TERRAIN_META?.resolutionM).toBe(80);
  });
  it('chaque masque a 360 azimuts finis et la hauteur du site est renseignée', () => {
    const withMask = SITES.filter((s) => s.terrain.horizonMask);
    expect(withMask.length).toBeGreaterThanOrEqual(8);
    for (const s of withMask) {
      const t = terrainInfo(s.id);
      expect(t.horizonElevationDeg).toHaveLength(360);
      expect(t.horizonElevationDeg.every(Number.isFinite)).toBe(true);
      expect(s.elevationM).toBe(t.elevationM);
    }
  });
  it('les sites hors du DEM (> -80,5°) restent sans masque, jamais un masque inventé', () => {
    for (const id of ['apollo11', 'apollo15', 'chandrayaan3', 'blue-ghost']) expect(SITES_BY_ID.get(id)!.terrain.horizonMask).toBe(false);
  });
  it("hauteurs cohérentes avec la géographie connue : plateau Mons Mouton et massif Malapert hauts", () => {
    expect(SITES_BY_ID.get('im2-mons-mouton')!.elevationM!).toBeGreaterThan(3000);
    expect(SITES_BY_ID.get('malapert')!.elevationM!).toBeGreaterThan(3000);
  });
  it("les points candidats de crête ne sont pas des fonds de cratère, et ont une pente moyenne <= 10°", () => {
    for (const s of SITES.filter((x) => x.coordinatesStatus === 'derived_from_dem')) {
      expect(s.elevationM!, s.id).toBeGreaterThan(-500);
      expect(s.terrain.slopeDeg!, s.id).toBeLessThanOrEqual(10);
      expect(s.coordinatesSource).toMatch(/Non officiel/);
    }
  });
});

describe('masque d\'horizon', () => {
  it('interpolation circulaire entre 359° et 0°', () => {
    const m = maskFromUniform([10, 0, 0, 0]); // 4 azimuts : 0°, 90°, 180°, 270°
    expect(m(0)).toBe(10);
    expect(m(45)).toBe(5);
    expect(m(315)).toBe(5); // entre 270° (0) et 360°=0° (10)
    expect(m(360)).toBe(10);
  });
});

describe('effet du relief sur les résultats', () => {
  it("Shackleton (crête) : l'horizon plat surestime l'ensoleillement (~100 %), le relief le ramène nettement plus bas", () => {
    const f = solarAnalysis(flat('shackleton'), p).sunlitFraction;
    const t = solarAnalysis(SITES_BY_ID.get('shackleton')!, p).sunlitFraction;
    expect(f).toBeGreaterThan(0.9);
    expect(f - t).toBeGreaterThan(0.2);
  });
  it("de Gerlache : l'horizon plat surestime aussi l'ensoleillement", () => {
    expect(solarAnalysis(flat('de-gerlache'), p).sunlitFraction - solarAnalysis(SITES_BY_ID.get('de-gerlache')!, p).sunlitFraction).toBeGreaterThan(0.2);
  });
  it("un sommet (Malapert, +4,4 km) voit la Terre plus longtemps qu'avec un horizon plat", () => {
    expect(earthAnalysis(SITES_BY_ID.get('malapert')!, p).visibleFraction).toBeGreaterThan(earthAnalysis(flat('malapert'), p).visibleFraction);
  });
  it('le plateau IM-2 reste éclairé et en vue de la Terre une bonne partie du temps', () => {
    const s = solarAnalysis(SITES_BY_ID.get('im2-mons-mouton')!, p);
    expect(s.sunlitFraction).toBeGreaterThan(0.3);
    expect(s.sunlitFraction).toBeLessThan(0.7);
  });
});

describe('API : niveau de calcul et provenance', () => {
  const app = createApp();
  it('site avec relief -> terrain-aware, source LOLA et limites citées', async () => {
    const r = await request(app).get('/api/sites/im2-mons-mouton/solar?date=2026-11-14').expect(200);
    expect(r.body.meta.calculationLevel).toBe('terrain-aware');
    expect(r.body.meta.sources.join(' ')).toMatch(/LOLA/);
    expect(r.body.meta.assumptions.join(' ')).toMatch(/80°S/);
  });
  it('site sans relief ou point personnalisé -> simplified (honnête)', async () => {
    const a = await request(app).get('/api/sites/apollo11/solar?date=2026-11-14').expect(200);
    expect(a.body.meta.calculationLevel).toBe('simplified');
    const c = await request(app).get('/api/sites/custom/solar?date=2026-11-14&lat=-86&lon=10').expect(200);
    expect(c.body.meta.calculationLevel).toBe('simplified');
  });
  it('/api/sites/:id annonce terrainHorizon et pente disponibles', async () => {
    const r = await request(app).get('/api/sites/malapert').expect(200);
    expect(r.body.availableData.terrainHorizon).toBe(true);
    expect(r.body.terrain.slopeDeg).not.toBeNull();
    expect(r.body.terrain.shadowRisk).toBeNull(); // jamais inventé
  });
});
