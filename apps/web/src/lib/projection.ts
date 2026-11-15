/**
 * Projection stéréographique polaire Sud sur la sphère lunaire (rayon 1 737,4 km), identique à celle de l'export
 * QuickMap : +proj=stere +a=1737400 +b=1737400 +lat_0=-90 +lon_0=0 +k=1 (Snyder, « Map Projections », aspect polaire Sud).
 * x vers 90°E, y vers la longitude 0° ; unités : mètres.
 */
export const MOON_RADIUS_M = 1_737_400;

const rad = (d: number) => (d * Math.PI) / 180;

export function southPolarStereo(latDeg: number, lonDeg: number): { x: number; y: number } {
  const rho = 2 * MOON_RADIUS_M * Math.tan(Math.PI / 4 + rad(latDeg) / 2);
  return { x: rho * Math.sin(rad(lonDeg)), y: rho * Math.cos(rad(lonDeg)) };
}

/** Rayon (m) du parallèle `latDeg` dans cette projection (pour tracer les cercles de latitude). */
export const parallelRadius = (latDeg: number) => 2 * MOON_RADIUS_M * Math.tan(Math.PI / 4 + rad(latDeg) / 2);

/** Géoréférencement de l'image (GeoTransform GDAL du fichier .vrt de l'export QuickMap). */
export const SOUTH_POLE_IMAGE = {
  src: '/maps/south-pole-stereo.png',
  widthPx: 1500,
  heightPx: 782,
  originX: -1785939.8976982096,
  originY: 931070,
  pixelSize: 2381.253196930946,
  credit: 'Image LROC WAC (NASA / GSFC / Arizona State University), export LROC QuickMap, projection stéréographique polaire Sud',
};
