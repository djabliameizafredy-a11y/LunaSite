import embedded from './horizons-reference.json';
import type { HorizonsPoint, ReferenceBody } from '../modules/validation/horizons';

import type { ReferenceMeta } from '@lunasite/shared-types';
export type { ReferenceMeta };
export interface ReferenceFile {
  meta: ReferenceMeta | null;
  sites: Record<string, Partial<Record<ReferenceBody, HorizonsPoint[]>>>;
}

/** Données embarquées (repli sans base), produites par scripts/import-horizons.ts. Vide tant que l'import n'a pas tourné. */
export const EMBEDDED_REFERENCE = embedded as unknown as ReferenceFile;

let reference: ReferenceFile = EMBEDDED_REFERENCE;
export const referenceState: { source: 'embedded' | 'database' } = { source: 'embedded' };

export function setReference(file: ReferenceFile, source: 'embedded' | 'database'): void {
  reference = file;
  referenceState.source = source;
}

export const getReference = (): ReferenceFile => reference;
