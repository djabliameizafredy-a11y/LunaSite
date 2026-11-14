import { z } from 'zod';
import type { ApiError } from '@lunasite/shared-types';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: ApiError['error']['code'],
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

/** Limites de charge (document de conception : 4 sites, 31 jours, 20 000 échantillons-site). */
export const LIMITS = { maxSites: 4, maxDays: 31, maxSamples: 20_000, defaultStepMinutes: 15 };

const isoDay = z
  .string({ required_error: 'obligatoire' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'format attendu YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), 'date inexistante');

export const dayToDate = (s: string) => new Date(`${s}T00:00:00Z`);

const num = (min: number, max: number) =>
  z.coerce.number({ invalid_type_error: 'nombre attendu' }).min(min).max(max);

export const panelQuery = z.object({
  panelAreaM2: num(0.0001, 10_000).optional(),
  efficiency: num(0, 1).optional(),
  panelTiltDeg: num(0, 90).optional(),
  panelAzimuthDeg: num(0, 360).optional(),
});

export const periodQuery = z.object({
  date: isoDay,
  days: z.coerce.number().int().min(1).max(LIMITS.maxDays).optional(),
  stepMinutes: z.coerce.number().int().min(1).max(1440).optional(),
});

export const compareBody = z
  .object({
    siteIds: z.array(z.string().min(1)).min(1).max(LIMITS.maxSites),
    startDate: isoDay.optional(),
    endDate: isoDay.optional(),
    /** Mode "plusieurs dates pour un site" : chaque date = 24 h UTC. */
    dates: z.array(isoDay).min(2).max(4).optional(),
    stepMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.dates) {
      if (v.startDate || v.endDate)
        ctx.addIssue({ code: 'custom', path: ['dates'], message: 'dates est exclusif de startDate/endDate' });
    } else {
      if (!v.startDate) ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'obligatoire' });
      if (!v.endDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'obligatoire' });
      if (v.siteIds.length < 2)
        ctx.addIssue({ code: 'custom', path: ['siteIds'], message: 'entre 2 et 4 sites pour comparer des sites' });
    }
  });

export function parse<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input);
  if (!r.success) {
    const i = r.error.issues[0];
    throw new HttpError(400, 'INVALID_INPUT', `${i.path.join('.') || 'requête'} : ${i.message}`, i.path.join('.') || undefined);
  }
  return r.data;
}

export function ensureBudget(sites: number, samplesPerSite: number): void {
  if (sites * samplesPerSite > LIMITS.maxSamples)
    throw new HttpError(
      422,
      'BUDGET_EXCEEDED',
      `Budget de calcul dépassé (${sites * samplesPerSite} > ${LIMITS.maxSamples} échantillons). Augmentez stepMinutes ou réduisez la période : la résolution n'est jamais réduite silencieusement.`,
      'stepMinutes',
    );
}
