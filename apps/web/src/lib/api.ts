import type { ApiError, EarthVisibilityResult, HorizonProfile, MissionScore, Site, SiteValidation, SolarResult, ValidationSummary } from '@lunasite/shared-types';

/** URL de l'API Express (apps/api). Surchargée par NEXT_PUBLIC_API_URL en déploiement. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Erreur API lisible par l'UI : code, message et champ fautif (jamais une page blanche). */
export class ApiRequestError extends Error {
  constructor(public status: number, public code: string, message: string, public field?: string) {
    super(message);
  }
}

const TIMEOUT_MS = 20_000;

/** Messages pour l'utilisateur : ce qui se passe et quoi faire. Le détail technique part dans la console. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    res = await fetch(`${API_URL}/api${path}`, { ...init, signal: ctrl.signal, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  } catch (err) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiRequestError(0, 'OFFLINE', 'Vous êtes hors ligne. Reconnectez-vous puis rechargez la page.');
    }
    if (ctrl.signal.aborted) {
      throw new ApiRequestError(0, 'TIMEOUT', 'Le calcul a pris trop de temps. Réessayez, ou choisissez une période plus courte.');
    }
    console.warn(`[LunaSite] API injoignable sur ${API_URL} (en local : npm run api:dev).`, err);
    throw new ApiRequestError(0, 'NETWORK', 'Connexion au serveur de calcul impossible. Vérifiez votre réseau et réessayez dans un instant.');
  } finally {
    clearTimeout(timer);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (body as ApiError | null)?.error;
    const fallback = res.status >= 500
      ? 'Une erreur est survenue de notre côté. Réessayez dans quelques instants.'
      : `La demande n'a pas pu être traitée (erreur ${res.status}).`;
    throw new ApiRequestError(res.status, e?.code ?? 'INTERNAL', e?.message ?? fallback, e?.field);
  }
  return body as T;
}

export interface Health { status: string; catalogueSource: 'embedded' | 'database'; catalogueFallbackReason: string | null }
export interface PeriodParams { date: string; days?: number; stepMinutes?: number }

const qs = (p: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();

const site = (id: string) => `/sites/${encodeURIComponent(id)}`;

export const api = {
  health: () => request<Health>('/health'),
  sites: () => request<Site[]>('/sites'),
  site: (id: string) => request<Site & { availableData: Record<string, boolean> }>(site(id)),
  solar: (id: string, p: PeriodParams) => request<SolarResult>(`${site(id)}/solar?${qs({ ...p })}`),
  earth: (id: string, p: PeriodParams) => request<EarthVisibilityResult>(`${site(id)}/earth-visibility?${qs({ ...p })}`),
  score: (id: string, p: PeriodParams) => request<MissionScore>(`${site(id)}/mission-score?${qs({ ...p })}`),
  validation: () => request<ValidationSummary>('/validation'),
  horizon: (id: string) => request<HorizonProfile>(`${site(id)}/horizon`),
  siteValidation: (id: string) => request<SiteValidation>(`${site(id)}/validation`),
};
