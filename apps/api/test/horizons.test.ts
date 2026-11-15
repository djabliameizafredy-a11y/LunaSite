import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { horizonsDateToIso, horizonsUrl, parseHorizonsResponse, parseHorizonsResult } from '../src/modules/validation/horizons';
import { compareWithHorizons } from '../src/modules/validation/compare';
import { EMBEDDED_REFERENCE, setReference } from '../src/data/reference';
import { createApp } from '../src/app';

// Vraie réponse de l'API JPL Horizons (v1.2), récupérée le 2026-11-14 : Soleil vu depuis Malapert
// (SITE_COORD -4.0774 E, -85.9222, 4.812 km), 2026-11-14 → 2026-11-15, pas de 6 h.
const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/horizons-sun-malapert-2026-11-14.json'), 'utf8'));
const MALAPERT = { latitude: -85.9222, longitude: -4.0774, elevationM: 4812 };

describe('client JPL Horizons', () => {
  it('construit la requête documentée (observateur sur la Lune, azimut/élévation, degrés, CSV)', () => {
    const u = new URL(horizonsUrl('earth', MALAPERT, '2026-11-14', '2026-11-15', '6 h'));
    expect(u.origin + u.pathname).toBe('https://ssd.jpl.nasa.gov/api/horizons.api');
    expect(u.searchParams.get('COMMAND')).toBe("'399'");
    expect(u.searchParams.get('CENTER')).toBe("'coord@301'");
    expect(u.searchParams.get('SITE_COORD')).toBe("'-4.0774,-85.9222,4.8120'");
    expect(u.searchParams.get('QUANTITIES')).toBe("'4'");
    expect(u.searchParams.get('ANG_FORMAT')).toBe("'DEG'");
  });

  it('lit la vraie réponse : 5 points, dates ISO, angles numériques', () => {
    const pts = parseHorizonsResponse(fixture);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual({ t: '2026-11-14T00:00:00Z', azimuthDeg: 130.70714147, elevationDeg: -1.103223058 });
    expect(pts[4].t).toBe('2026-11-15T00:00:00Z');
  });

  it('convertit les dates Horizons et refuse les formats inconnus', () => {
    expect(horizonsDateToIso('2026-Nov-14 06:00:00')).toBe('2026-11-14T06:00:00Z');
    expect(() => horizonsDateToIso('14/11/2026')).toThrow(/illisible/);
  });

  it('échoue explicitement si la réponse change de format ou signale une erreur', () => {
    expect(() => parseHorizonsResponse({ error: 'Cannot find target' })).toThrow(/Cannot find target/);
    expect(() => parseHorizonsResponse({ ...fixture, signature: { version: '9.9' } })).toThrow(/version/);
    expect(() => parseHorizonsResult(fixture.result.replace('$$SOE', ''))).toThrow(/SOE/);
    expect(() => parseHorizonsResult(fixture.result.replace('Azimuth_(a-app)', 'Az'))).toThrow(/en-tête/);
  });
});

describe('notre moteur comparé à JPL Horizons (données réelles)', () => {
  it('Soleil depuis Malapert : écart < 0,01° en élévation et en azimut', () => {
    const c = compareWithHorizons(MALAPERT, 'sun', parseHorizonsResponse(fixture));
    expect(c.samples).toBe(5);
    expect(c.maxAbsElevationDiffDeg).toBeLessThan(0.01);
    expect(c.maxAbsAzimuthDiffDeg).toBeLessThan(0.01);
    expect(c.visibilityDisagreements).toBe(0);
  });

  it('sans référence : aucun chiffre inventé (null, pas 0)', () => {
    const c = compareWithHorizons(MALAPERT, 'earth', []);
    expect(c.samples).toBe(0);
    expect(c.maxAbsElevationDiffDeg).toBeNull();
  });
});

describe('GET /api/validation', () => {
  afterEach(() => setReference(EMBEDDED_REFERENCE, 'embedded'));

  it('sans import : réponse explicite « indisponible », pas un faux résultat', async () => {
    setReference({ meta: null, sites: {} }, 'embedded');
    const r = await request(createApp()).get('/api/validation').expect(200);
    expect(r.body.available).toBe(false);
    expect(r.body.reason).toMatch(/data:horizons/);
    expect(r.body.sites).toEqual([]);
  });

  it('avec des références : écarts par site et résumé', async () => {
    setReference({
      meta: { datasetId: 'jpl-horizons-observer', source: 'test', apiVersion: '1.2', ephemeris: 'DE441', centerFrame: 'MEAN_ME', fetchedAt: '2026-11-14T00:00:00Z', start: '2026-11-14', stop: '2026-11-15', step: '6 h', sha256: 'x' },
      sites: { malapert: { sun: parseHorizonsResponse(fixture) } },
    }, 'embedded');
    const r = await request(createApp()).get('/api/validation').expect(200);
    expect(r.body.available).toBe(true);
    expect(r.body.sites).toHaveLength(1);
    expect(r.body.sites[0].sun.samples).toBe(5);
    expect(r.body.summary.maxAbsElevationDiffDeg).toBeLessThan(0.01);
    const one = await request(createApp()).get('/api/sites/malapert/validation').expect(200);
    expect(one.body.sun.samples).toBe(5);
    expect(one.body.earth.samples).toBe(0);
  });

  it('site inconnu : 404', async () => {
    await request(createApp()).get('/api/sites/atlantide/validation').expect(404);
  });
});
