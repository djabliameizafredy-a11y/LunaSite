import type { BodyComparison, Site } from '@lunasite/shared-types';
export type { BodyComparison };
import { bodyState } from '../../engine/lunar-frame';
import { elevAz, localFrame } from '../../engine/geometry';
import { METHOD_VERSION } from '../../engine/series';
import type { HorizonsPoint, ReferenceBody } from './horizons';


const wrap180 = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

/** Compare notre moteur géométrique aux valeurs JPL Horizons, aux mêmes instants et au même point. */
export function compareWithHorizons(site: Pick<Site, 'latitude' | 'longitude' | 'elevationM'>, body: ReferenceBody, ref: HorizonsPoint[]): BodyComparison {
  if (!ref.length) {
    return { body, samples: 0, period: null, maxAbsElevationDiffDeg: null, meanAbsElevationDiffDeg: null, maxAbsAzimuthDiffDeg: null, visibilityDisagreements: 0 };
  }
  const frame = localFrame(site.latitude, site.longitude, site.elevationM);
  let maxEl = 0, sumEl = 0, maxAz = 0, disagree = 0;
  for (const p of ref) {
    const s = bodyState(new Date(p.t));
    const ours = elevAz(frame, body === 'sun' ? s.sunMoonFixed : s.earthMoonFixed);
    const dEl = Math.abs(ours.elevationDeg - p.elevationDeg);
    maxEl = Math.max(maxEl, dEl);
    sumEl += dEl;
    // L'azimut n'a pas de sens au zénith : on l'ignore au-dessus de 89°.
    if (Math.abs(p.elevationDeg) < 89) maxAz = Math.max(maxAz, Math.abs(wrap180(ours.azimuthDeg - p.azimuthDeg)));
    if (ours.elevationDeg > 0 !== p.elevationDeg > 0) disagree++;
  }
  const times = ref.map((p) => p.t).sort();
  const r = (x: number) => Math.round(x * 1e5) / 1e5;
  return {
    body,
    samples: ref.length,
    period: { start: times[0], end: times[times.length - 1] },
    maxAbsElevationDiffDeg: r(maxEl),
    meanAbsElevationDiffDeg: r(sumEl / ref.length),
    maxAbsAzimuthDiffDeg: r(maxAz),
    visibilityDisagreements: disagree,
  };
}

export const VALIDATION_NOTES = [
  "Horizons donne des positions « apparentes » (temps de lumière, aberration, déviation relativiste) ; notre moteur est géométrique : un écart constant de quelques millièmes de degré est attendu.",
  'Comparaison au-dessus de l’horizon plat (sans relief) : elle valide la géométrie Soleil/Terre, pas le masque de relief LOLA.',
  `Méthode LunaSite comparée : ${METHOD_VERSION}.`,
];
