import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { ApiError, Site } from '@lunasite/shared-types';
import { SITES, SITES_BY_ID } from './data/sites';
import { catalogueState } from './data/catalogue-state';
import { compareBody, dayToDate, HttpError, LIMITS, panelQuery, parse, periodQuery } from './common/http';
import { earthAnalysis, gridFor, makePeriod, missionScore, solarAnalysis } from './modules/solar/analysis';
import { compareWithHorizons, VALIDATION_NOTES } from './modules/validation/compare';
import { getReference, referenceState } from './data/reference';

const coords = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(360).optional(),
});

/** Résout un site du catalogue, ou un point libre via `siteId=custom` + lat/lon (coordonnées personnalisées). */
function resolveSite(id: string, query: unknown): Site {
  if (id === 'custom') {
    const { lat, lon } = parse(coords, query);
    if (lat === undefined) throw new HttpError(400, 'INVALID_INPUT', 'lat : obligatoire pour un site personnalisé', 'lat');
    if (lon === undefined) throw new HttpError(400, 'INVALID_INPUT', 'lon : obligatoire pour un site personnalisé', 'lon');
    return {
      id: 'custom', name: `Point personnalisé (${lat}°, ${lon}°)`, region: 'custom', latitude: lat,
      longitude: lon > 180 ? lon - 360 : lon, elevationM: null, terrainType: null, origin: 'reference',
      description: "Coordonnées saisies par l'utilisateur (latitude sélénographique, longitude Est positive).",
      coordinatesStatus: 'published', coordinatesSource: 'Saisie utilisateur',
      terrain: { slopeDeg: null, localReliefM: null, shadowRisk: null, horizonMask: false },
    };
  }
  const site = SITES_BY_ID.get(id);
  if (!site) throw new HttpError(404, 'NOT_FOUND', `Site inconnu : ${id}`, 'id');
  return site;
}

function periodOf(query: unknown) {
  const q = parse(periodQuery, query);
  return makePeriod(dayToDate(q.date), q.days ?? 1, q.stepMinutes);
}

const wrap = (fn: (req: Request, res: Response) => unknown) => (req: Request, res: Response, next: NextFunction) => {
  try { res.json(fn(req, res)); } catch (e) { next(e); }
};

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
  app.use(express.json({ limit: '50kb' }));
  app.use((req, res, next) => { res.locals.requestId = randomUUID(); res.setHeader('X-Request-Id', res.locals.requestId); next(); });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', catalogueSource: catalogueState.source, catalogueFallbackReason: catalogueState.error }));

  app.get('/api/sites', wrap((req) => {
    const { region, terrain, origin } = req.query as Record<string, string | undefined>;
    return SITES.filter((s) => (!region || s.region === region) && (!terrain || s.terrainType === terrain) && (!origin || s.origin === origin));
  }));

  app.get('/api/sites/:id', wrap((req) => {
    const site = resolveSite(req.params.id, req.query);
    return {
      ...site,
      availableData: {
        sunPosition: true, earthPosition: true, energyPotential: true,
        terrainHorizon: site.terrain.horizonMask,
        terrainMetrics: site.terrain.slopeDeg != null && site.terrain.shadowRisk != null,
      },
    };
  }));

  app.get('/api/sites/:id/solar', wrap((req) => {
    const site = resolveSite(req.params.id, req.query);
    const panel = parse(panelQuery, req.query);
    const clean = Object.fromEntries(Object.entries(panel).filter(([, v]) => v !== undefined));
    return solarAnalysis(site, periodOf(req.query), clean);
  }));

  app.get('/api/sites/:id/earth-visibility', wrap((req) => earthAnalysis(resolveSite(req.params.id, req.query), periodOf(req.query))));
  app.get('/api/sites/:id/mission-score', wrap((req) => missionScore(resolveSite(req.params.id, req.query), periodOf(req.query))));

  app.post('/api/compare', wrap((req) => {
    const b = parse(compareBody, req.body);
    const sites = b.siteIds.map((id) => resolveSite(id, req.body));
    const periods = b.dates
      ? b.dates.map((d) => makePeriod(dayToDate(d), 1, b.stepMinutes))
      : [(() => {
          const start = dayToDate(b.startDate!), end = dayToDate(b.endDate!);
          const days = (end.getTime() - start.getTime()) / 86_400_000;
          if (!(days > 0)) throw new HttpError(400, 'INVALID_INPUT', 'endDate : doit être strictement après startDate (fin exclusive)', 'endDate');
          if (days > LIMITS.maxDays) throw new HttpError(400, 'INVALID_INPUT', `période limitée à ${LIMITS.maxDays} jours`, 'endDate');
          return makePeriod(start, days, b.stepMinutes);
        })()];
    const scenarios = periods.flatMap((p) => {
      const grid = gridFor(p, sites.length * periods.length);
      return sites.map((site) => {
        const solar = solarAnalysis(site, p, {}, grid);
        const earth = earthAnalysis(site, p, grid);
        const score = missionScore(site, p, grid);
        return {
          siteId: site.id, siteName: site.name, period: { start: p.start.toISOString(), end: p.end.toISOString() },
          solar: {
            sunlitHours: solar.sunlitHours, darknessHours: solar.darknessHours, sunlitFraction: solar.sunlitFraction,
            maxSunElevationDeg: solar.maxSunElevationDeg, longestDarknessHours: solar.longestDarknessHours,
            sunWindows: solar.sunWindows, energyPotential: solar.energyPotential,
          },
          earth: {
            visibleHours: earth.visibleHours, visibleFraction: earth.visibleFraction,
            maxEarthElevationDeg: earth.maxEarthElevationDeg, longestVisibilityGapHours: earth.longestVisibilityGapHours,
            windows: earth.windows,
          },
          score, meta: solar.meta,
        };
      });
    });
    return { mode: b.dates ? 'dates' : 'sites', scenarios };
  }));

  app.get('/api/recommendations', wrap((req) => {
    const p = periodOf(req.query);
    const region = typeof req.query.region === 'string' ? req.query.region : undefined;
    const sites = SITES.filter((s) => (s.origin !== 'reference' || s.id === 'south-pole') && (!region || s.region === region));
    if (!sites.length) throw new HttpError(404, 'NOT_FOUND', `Aucun site pour la région : ${region}`, 'region');
    const grid = gridFor(p, sites.length);
    const scored = sites.map((site) => ({ site, score: missionScore(site, p, grid) }));
    // Base de classement COMMUNE : global seulement si tous les sites ont un score global, sinon partiel pour tous
    // (comparer un score global et un score partiel serait trompeur).
    const basis: 'global' | 'partial' = scored.every((x) => x.score.globalScore != null) ? 'global' : 'partial';
    const ranking = scored.map(({ site, score }) => ({
      siteId: site.id, siteName: site.name,
      rankingScore: basis === 'global' ? score.globalScore! : score.partialScore, rankingBasis: basis, score,
    })).sort((a, b) => b.rankingScore - a.rankingScore).map((r, i) => ({ rank: i + 1, ...r }));
    return {
      period: { start: p.start.toISOString(), end: p.end.toISOString() },
      rankingBasis: basis,
      criteria: basis === 'global'
        ? "Tri par score global (0,40 solaire + 0,35 communication + 0,25 terrain). Aide à la comparaison, pas une recommandation opérationnelle d'atterrissage."
        : "Tri par score partiel (solaire + communication) car le score terrain n'existe pas pour tous les sites ; filtrez avec ?region=south-pole pour un classement avec le terrain. Pas une recommandation opérationnelle d'atterrissage.",
      ranking,
    };
  }));

  // Validation de notre moteur contre JPL Horizons (références importées par scripts/import-horizons.ts).
  const validationFor = (site: Site) => {
    const ref = getReference().sites[site.id];
    return {
      siteId: site.id, siteName: site.name,
      sun: compareWithHorizons(site, 'sun', ref?.sun ?? []),
      earth: compareWithHorizons(site, 'earth', ref?.earth ?? []),
    };
  };
  const validationEnvelope = () => {
    const { meta } = getReference();
    return {
      available: meta != null,
      reason: meta ? null : "Références JPL Horizons non importées : lancer « npm run data:horizons » dans apps/api.",
      source: meta, referenceSource: referenceState.source, notes: VALIDATION_NOTES,
    };
  };

  app.get('/api/validation', wrap(() => {
    const env = validationEnvelope();
    const sites = env.available ? SITES.map(validationFor).filter((v) => v.sun.samples + v.earth.samples > 0) : [];
    const worst = (k: 'maxAbsElevationDiffDeg' | 'maxAbsAzimuthDiffDeg') =>
      sites.length ? Math.max(...sites.flatMap((v) => [v.sun[k] ?? 0, v.earth[k] ?? 0])) : null;
    return { ...env, summary: { sites: sites.length, maxAbsElevationDiffDeg: worst('maxAbsElevationDiffDeg'), maxAbsAzimuthDiffDeg: worst('maxAbsAzimuthDiffDeg') }, sites };
  }));

  app.get('/api/sites/:id/validation', wrap((req) => {
    const site = SITES_BY_ID.get(req.params.id);
    if (!site) throw new HttpError(404, 'NOT_FOUND', `Site inconnu : ${req.params.id}`, 'id');
    const env = validationEnvelope();
    return { ...env, ...(env.available ? validationFor(site) : { siteId: site.id, siteName: site.name, sun: null, earth: null }) };
  }));

  app.use((req, _res, next) => next(new HttpError(404, 'NOT_FOUND', `Route inconnue : ${req.method} ${req.path}`)));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const requestId = res.locals.requestId as string;
    if (err instanceof HttpError) {
      const body: ApiError = { error: { code: err.code, message: err.message, field: err.field, requestId } };
      return res.status(err.status).json(body);
    }
    if ((err as { type?: string })?.type === 'entity.parse.failed')
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'JSON invalide', requestId } } satisfies ApiError);
    console.error(requestId, err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Erreur interne', requestId } } satisfies ApiError);
  });

  return app;
}
