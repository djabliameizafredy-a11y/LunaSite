import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('API REST', () => {
  it('GET /api/health/db sans DATABASE_URL -> 503 explicite (la tâche planifiée échoue, elle ne ment pas)', async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const r = await request(app).get('/api/health/db').expect(503);
      expect(r.body).toMatchObject({ status: 'disabled', database: false });
      expect(r.headers['cache-control']).toBe('no-store');
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });

  it('GET /api/sites liste et filtre', async () => {
    const all = await request(app).get('/api/sites').expect(200);
    expect(all.body.length).toBeGreaterThan(5);
    const sp = await request(app).get('/api/sites?region=south-pole').expect(200);
    expect(sp.body.every((s: { region: string }) => s.region === 'south-pole')).toBe(true);
  });

  it('GET /api/sites/:id inconnu -> 404 distinct des données indisponibles', async () => {
    const r = await request(app).get('/api/sites/nope').expect(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
    expect(r.body.error.requestId).toBeTruthy();
  });

  it('solar : ResultMeta complet, énergie avec paramètres, niveau simplified', async () => {
    const r = await request(app).get('/api/sites/apollo11/solar?date=2026-11-14').expect(200);
    expect(r.body.meta.calculationLevel).toBe('simplified');
    expect(r.body.meta.isMock).toBe(false);
    expect(r.body.meta.period.end).toBe('2026-11-15T00:00:00.000Z'); // [00:00, 00:00 lendemain)
    expect(r.body.meta.assumptions.join(' ')).toMatch(/relief local n'est PAS pris en compte/);
    expect(r.body.energyPotential.parameters.panelAreaM2).toBe(1);
    expect(r.body.sunPosition).toHaveLength(96);
  });

  it("paramètres d'énergie personnalisés pris en compte", async () => {
    const a = await request(app).get('/api/sites/apollo11/solar?date=2026-11-19&days=3').expect(200);
    const b = await request(app).get('/api/sites/apollo11/solar?date=2026-11-19&days=3&panelAreaM2=2').expect(200);
    expect(b.body.energyPotential.indicativeEnergyWh).toBeCloseTo(2 * a.body.energyPotential.indicativeEnergyWh, 0);
  });

  it('entrée invalide -> 400 avec le champ fautif', async () => {
    const bad = await request(app).get('/api/sites/apollo11/solar?date=2026-13-45').expect(400);
    expect(bad.body.error.code).toBe('INVALID_INPUT');
    expect(bad.body.error.field).toBe('date');
    const noDate = await request(app).get('/api/sites/apollo11/earth-visibility').expect(400);
    expect(noDate.body.error.field).toBe('date');
    await request(app).get('/api/sites/apollo11/solar?date=2026-11-14&efficiency=3').expect(400);
  });

  it('budget dépassé -> 422, pas de réduction silencieuse', async () => {
    const r = await request(app).get('/api/sites/apollo11/solar?date=2026-11-14&days=31&stepMinutes=1').expect(422);
    expect(r.body.error.code).toBe('BUDGET_EXCEEDED');
  });

  it('mission-score : score global null expliqué (jamais 0) pour un site sans données de relief', async () => {
    const r = await request(app).get('/api/sites/apollo11/mission-score?date=2026-11-14&days=30&stepMinutes=60').expect(200);
    expect(r.body.terrainScore).toBeNull();
    expect(r.body.terrainScoreDetail).toBeNull();
    expect(r.body.globalScore).toBeNull();
    expect(r.body.globalScoreUnavailableReason).toMatch(/relief/);
    expect(r.body.partialScore).toBeGreaterThanOrEqual(0);
    expect(r.body.partialScoreCriteria).toEqual(['solar', 'communication']);
  });

  it('mission-score : site polaire -> score terrain détaillé et score global calculé', async () => {
    const r = await request(app).get('/api/sites/malapert/mission-score?date=2026-11-14&days=30&stepMinutes=60').expect(200);
    expect(r.body.terrainScore).toBeGreaterThan(0);
    expect(r.body.terrainScoreDetail.version).toBe('terrain-v0.1');
    expect(r.body.terrainScoreDetail.params.slopeZeroDeg).toBe(15);
    expect(r.body.globalScoreUnavailableReason).toBeNull();
    const w = r.body.weights;
    expect(r.body.globalScore).toBeCloseTo(w.solar * r.body.solarScore + w.communication * r.body.communicationScore + w.terrain * r.body.terrainScore, 0);
  });

  it('site personnalisé via lat/lon', async () => {
    const r = await request(app).get('/api/sites/custom/earth-visibility?date=2026-11-14&lat=0&lon=180').expect(200);
    expect(r.body.visibleHours).toBe(0);
    await request(app).get('/api/sites/custom/solar?date=2026-11-14').expect(400);
  });

  it('compare : 2 sites sur une période, fin exclusive', async () => {
    const r = await request(app).post('/api/compare')
      .send({ siteIds: ['shackleton', 'malapert'], startDate: '2026-11-14', endDate: '2026-11-21', stepMinutes: 60 }).expect(200);
    expect(r.body.scenarios).toHaveLength(2);
    await request(app).post('/api/compare')
      .send({ siteIds: ['shackleton', 'malapert'], startDate: '2026-11-14', endDate: '2026-11-14' }).expect(400);
    await request(app).post('/api/compare').send({ siteIds: ['shackleton'], startDate: '2026-11-14', endDate: '2026-11-20' }).expect(400);
    await request(app).post('/api/compare').send({ siteIds: ['x', 'malapert'], startDate: '2026-11-14', endDate: '2026-11-20' }).expect(404);
  });

  it('compare : plusieurs dates pour un même site', async () => {
    const r = await request(app).post('/api/compare')
      .send({ siteIds: ['malapert'], dates: ['2026-11-14', '2026-11-20', '2026-12-01'] }).expect(200);
    expect(r.body.mode).toBe('dates');
    expect(r.body.scenarios).toHaveLength(3);
  });

  it('recommendations : classement avec base explicite', async () => {
    const r = await request(app).get('/api/recommendations?date=2026-11-14&days=30&stepMinutes=120').expect(200);
    expect(r.body.ranking[0].rank).toBe(1);
    const scores = r.body.ranking.map((x: { rankingScore: number }) => x.rankingScore);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(r.body.ranking[0].rankingBasis).toBe('partial');
    expect(r.body.rankingBasis).toBe('partial'); // base commune : Apollo etc. n'ont pas de terrain
  });

  it('recommendations ?region=south-pole : classement sur le score global, base commune', async () => {
    const r = await request(app).get('/api/recommendations?date=2026-11-14&days=30&stepMinutes=120&region=south-pole').expect(200);
    expect(r.body.rankingBasis).toBe('global');
    expect(r.body.ranking.every((x: { rankingBasis: string }) => x.rankingBasis === 'global')).toBe(true);
    await request(app).get('/api/recommendations?date=2026-11-14&region=mars').expect(404);
  });

  it('JSON invalide -> 400', async () => {
    await request(app).post('/api/compare').set('Content-Type', 'application/json').send('{bad').expect(400);
  });
});
