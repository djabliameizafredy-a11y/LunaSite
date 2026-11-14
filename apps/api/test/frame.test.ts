import { describe, it, expect } from 'vitest';
import * as A from 'astronomy-engine';
import { bodyState } from '../src/engine/lunar-frame';

const D = 180 / Math.PI;

describe('repère lunaire (modèle IAU) vs libration astronomy-engine', () => {
  // La direction Lune->Terre dans le repère lunaire fixe = point sub-terrestre
  // (latitude/longitude de libration). Référence indépendante : A.Libration.
  const dates = ['2026-11-14T00:00:00Z', '2026-11-21T06:00:00Z', '2027-03-03T12:00:00Z', '2025-03-06T06:00:00Z', '2028-07-19T18:00:00Z'];
  for (const iso of dates) {
    it(`sub-Earth point cohérent au ${iso}`, () => {
      const d = new Date(iso);
      const [x, y, z] = bodyState(d).earthMoonFixed;
      const r = Math.hypot(x, y, z);
      const lat = Math.asin(z / r) * D;
      const lon = Math.atan2(y, x) * D;
      const L = A.Libration(d);
      expect(Math.abs(lat - L.elat)).toBeLessThan(0.1);
      expect(Math.abs(lon - L.elon)).toBeLessThan(0.1);
    });
  }
});
