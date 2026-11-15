// Repris du prototype de l'équipe (texture lunaire procédurale, sans réseau). Illustratif : pas une mosaïque NASA.
/**
 * Carte lunaire equirectangulaire PROCEDURALE (canvas, sans reseau).
 *
 * Inspire des mosaïques LROC WAC (QuickMap / Moon Trek servent de reference
 * pour les positions) : mers sombres, cratères nommes a l'echelle (avec
 * exageration visuelle des petits), rayons clairs des cratères jeunes,
 * grain regolitique par bruit fractal.
 *
 * Convention cartographique : bord gauche = 180°O (-180), bord droit = 180°E,
 * ligne du milieu = equateur. Identique au mapping UV de THREE.SphereGeometry
 * avec u=0 a gauche -> compatible globe 3D et carte 2D.
 */

/* ------------------------------------------------------------------ */
/* PRNG + bruit                                                        */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(ix: number, iy: number, seed: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 144665)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  const u = smooth(fx);
  const v = smooth(fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + o * 1013);
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm; // [0, 1]
}

/* ------------------------------------------------------------------ */
/* Definitions geographiques (selenographique, lon en degres Est)      */
/* ------------------------------------------------------------------ */

interface MareDef {
  name: string;
  lat: number;
  lon: number;
  /** Demi-axes en degres (longitude / latitude). */
  rx: number;
  ry: number;
  rot?: number;
  blobs: number;
  /** 0-1 : opacite globale (les grandes mers sont plus denses). */
  strength: number;
}

const MARIA: MareDef[] = [
  // Face visible
  { name: 'Imbrium', lat: 32.8, lon: -15.6, rx: 15, ry: 12, blobs: 16, strength: 0.85 },
  { name: 'Serenitatis', lat: 28.0, lon: 17.5, rx: 9.5, ry: 9, blobs: 12, strength: 0.8 },
  { name: 'Tranquillitatis', lat: 8.5, lon: 31.4, rx: 11, ry: 10, rot: 0.4, blobs: 13, strength: 0.75 },
  { name: 'Crisium', lat: 17.0, lon: 59.1, rx: 5.6, ry: 6.4, blobs: 9, strength: 0.82 },
  { name: 'Fecunditatis', lat: -7.8, lon: 51.3, rx: 9, ry: 10.5, rot: 0.5, blobs: 11, strength: 0.66 },
  { name: 'Nectaris', lat: -15.2, lon: 35.5, rx: 5.2, ry: 5.6, blobs: 8, strength: 0.72 },
  { name: 'Nubium', lat: -21.3, lon: -16.6, rx: 6.4, ry: 6.2, blobs: 9, strength: 0.62 },
  { name: 'Humorum', lat: -24.4, lon: -38.6, rx: 4.9, ry: 5.4, blobs: 8, strength: 0.74 },
  { name: 'Vaporum', lat: 13.3, lon: 3.6, rx: 4.6, ry: 4.2, blobs: 7, strength: 0.58 },
  { name: 'Aestuum', lat: 10.9, lon: -8.8, rx: 3.4, ry: 3.0, blobs: 6, strength: 0.6 },
  { name: 'Cognitum', lat: -3.8, lon: -36.9, rx: 4.2, ry: 3.6, blobs: 7, strength: 0.6 },
  { name: 'Medii', lat: 2.4, lon: 1.0, rx: 1.8, ry: 1.6, blobs: 4, strength: 0.5 },
  // Oceanus Procellarum : immense, N-S
  { name: 'Procellarum-N', lat: 40, lon: -52, rx: 12, ry: 14, rot: 0.3, blobs: 14, strength: 0.72 },
  { name: 'Procellarum-C', lat: 16, lon: -55, rx: 13, ry: 15, blobs: 16, strength: 0.78 },
  { name: 'Procellarum-S', lat: -8, lon: -48, rx: 10, ry: 12, rot: -0.4, blobs: 12, strength: 0.66 },
  // Bande Frigoris + Roris
  { name: 'Frigoris-E', lat: 57.5, lon: 25, rx: 17, ry: 3.6, blobs: 9, strength: 0.62 },
  { name: 'Frigoris-O', lat: 56.5, lon: -25, rx: 17, ry: 3.4, blobs: 9, strength: 0.6 },
  { name: 'Roris', lat: 55, lon: -58, rx: 8, ry: 3.4, rot: 0.5, blobs: 6, strength: 0.5 },
  // Mers limbares / bord Est
  { name: 'Marginis', lat: 13.3, lon: 86.3, rx: 4.0, ry: 4.6, blobs: 6, strength: 0.5 },
  { name: 'Smythii', lat: 2.1, lon: 87.5, rx: 4.4, ry: 4.8, blobs: 7, strength: 0.62 },
  { name: 'Australe', lat: -38.9, lon: 93.4, rx: 12, ry: 8, rot: 0.6, blobs: 10, strength: 0.42 },
  { name: 'Orientale (interieur)', lat: -19.4, lon: -92.8, rx: 2.6, ry: 2.8, blobs: 5, strength: 0.68 },
  // Face cachee
  { name: 'Moscoviense', lat: 26.3, lon: 147.9, rx: 2.8, ry: 3.0, blobs: 5, strength: 0.66 },
  { name: 'Ingenii', lat: -35.5, lon: 163.5, rx: 8.5, ry: 7.5, blobs: 8, strength: 0.4 },
  { name: 'SPA (bande)', lat: -53, lon: 169, rx: 26, ry: 12, rot: -0.3, blobs: 12, strength: 0.24 },
  { name: 'Gagarin', lat: -20.3, lon: 149.2, rx: 7.5, ry: 7.0, blobs: 6, strength: 0.22 },
];

interface CraterDef {
  name: string;
  lat: number;
  lon: number;
  /** Diametre km. */
  d: number;
  style?: 'rays' | 'dark' | 'bright' | 'rim';
}

const CRATERS: CraterDef[] = [
  // Marqueurs emblematiques face visible
  { name: 'Tycho', lat: -43.31, lon: -11.37, d: 85, style: 'rays' },
  { name: 'Copernic', lat: 9.62, lon: -20.08, d: 93, style: 'rays' },
  { name: 'Kepler', lat: 8.12, lon: -38.03, d: 32, style: 'rays' },
  { name: 'Aristarque', lat: 23.73, lon: -47.49, d: 40, style: 'bright' },
  { name: 'Platon', lat: 51.62, lon: -9.38, d: 101, style: 'dark' },
  { name: 'Clavius', lat: -58.4, lon: -14.4, d: 231 },
  { name: 'Ptolemee', lat: -9.3, lon: -1.9, d: 153 },
  { name: 'Alphonsus', lat: -13.4, lon: -2.8, d: 119 },
  { name: 'Arzachel', lat: -18.2, lon: -1.9, d: 97 },
  { name: 'Archimede', lat: 29.72, lon: -4.01, d: 83 },
  { name: 'Aristote', lat: 50.2, lon: 17.4, d: 87 },
  { name: 'Eudoxe', lat: 44.1, lon: 16.3, d: 67 },
  { name: 'Posidonius', lat: 31.9, lon: 29.99, d: 95 },
  { name: 'Theophile', lat: -11.4, lon: 26.4, d: 99, style: 'rim' },
  { name: 'Cyrillus', lat: -13.2, lon: 24.0, d: 98 },
  { name: 'Catharina', lat: -18.1, lon: 23.4, d: 100 },
  { name: 'Langrenus', lat: -8.86, lon: 60.89, d: 127, style: 'rim' },
  { name: 'Petavius', lat: -19.5, lon: 60.4, d: 177 },
  { name: 'Vendelinus', lat: -16.3, lon: 61.6, d: 147 },
  { name: 'Grimaldi', lat: -5.5, lon: -68.3, d: 173, style: 'dark' },
  { name: 'Riccioli', lat: -3.3, lon: -74.6, d: 146, style: 'dark' },
  { name: 'Hevelius', lat: 2.2, lon: -67.6, d: 106 },
  { name: 'Gassendi', lat: -17.55, lon: -39.96, d: 110 },
  { name: 'Schickard', lat: -44.34, lon: -54.57, d: 227 },
  { name: 'Bailly', lat: -66.5, lon: -69.1, d: 307 },
  { name: 'Pitatus', lat: -29.9, lon: -13.5, d: 106 },
  { name: 'Maginus', lat: -50.5, lon: -6.3, d: 163 },
  { name: 'Longomontanus', lat: -49.6, lon: -21.8, d: 145 },
  { name: 'Wilhelm', lat: -43.8, lon: -20.4, d: 106 },
  { name: 'Eratosthene', lat: 14.47, lon: -11.33, d: 59, style: 'rim' },
  { name: 'Autolycus', lat: 30.7, lon: 1.5, d: 39 },
  { name: 'Aristille', lat: 33.0, lon: 5.2, d: 54 },
  { name: 'Timocharis', lat: 26.7, lon: -13.1, d: 33 },
  { name: 'Lambert', lat: 25.7, lon: -20.7, d: 30 },
  { name: 'Euler', lat: 23.3, lon: -29.3, d: 27 },
  { name: 'Marius', lat: 11.9, lon: -50.8, d: 41 },
  { name: 'Krafft', lat: 16.6, lon: -72.4, d: 51 },
  { name: 'Billy', lat: -13.5, lon: -50.3, d: 45, style: 'dark' },
  { name: 'Hansteen', lat: -11.5, lon: -52.1, d: 45 },
  { name: 'Mersenius', lat: -21.5, lon: -48.3, d: 84 },
  { name: 'Capuanus', lat: -34.4, lon: -46.8, d: 60 },
  { name: 'Bullialdus', lat: -20.7, lon: -22.3, d: 61, style: 'rim' },
  { name: 'Campanus', lat: -28.0, lon: -27.3, d: 48 },
  { name: 'Mercator', lat: -29.3, lon: -26.1, d: 47 },
  { name: 'Werner', lat: -28.0, lon: 1.3, d: 70 },
  { name: 'Aliacensis', lat: -30.6, lon: 5.2, d: 80 },
  { name: 'Sacrobosco', lat: -23.9, lon: 17.4, d: 98 },
  { name: 'Janssen', lat: -45.2, lon: 19.2, d: 190 },
  { name: 'Piccolomini', lat: -29.7, lon: 32.2, d: 88 },
  { name: 'Fracastorius', lat: -21.2, lon: 33.0, d: 124, style: 'dark' },
  { name: 'Vlacq', lat: -53.3, lon: 38.5, d: 89 },
  { name: 'Taruntius', lat: 5.6, lon: 46.5, d: 56 },
  { name: 'Webb', lat: 0.9, lon: 62.6, d: 42 },
  { name: 'Apollonius', lat: -4.5, lon: 61.1, d: 50 },
  { name: 'Condorcet', lat: 11.5, lon: 69.6, d: 74 },
  { name: 'Maskelyne', lat: 2.2, lon: 33.7, d: 32 },
  { name: 'Vitruvius', lat: 17.6, lon: 30.4, d: 30 },
  { name: 'Bessel', lat: 6.7, lon: 17.9, d: 16 },
  { name: 'Menelaus', lat: 15.6, lon: 16.0, d: 27, style: 'bright' },
  { name: 'Plinius', lat: 9.6, lon: 23.6, d: 43, style: 'rim' },
  // Face cachee
  { name: 'Tsiolkovskiy', lat: -20.4, lon: 129.2, d: 185, style: 'dark' },
  { name: 'Korolev', lat: -4.0, lon: 157.4, d: 437 },
  { name: 'Gagarine', lat: -20.3, lon: 149.2, d: 265 },
  { name: 'Hertzsprung', lat: -17.0, lon: -128.1, d: 570 },
  { name: 'Apollo', lat: -36.3, lon: -151.8, d: 537 },
  { name: 'Oppenheimer', lat: -33.9, lon: -166.1, d: 241 },
  { name: 'Poincare', lat: -56.6, lon: 161.3, d: 319 },
  { name: 'Planck', lat: -57.4, lon: 135.9, d: 314 },
  { name: 'Von Karman', lat: -44.8, lon: 175.9, d: 94 },
  { name: 'Campbell', lat: -44.9, lon: 153.5, d: 222 },
  { name: 'Fermi', lat: -19.9, lon: 121.9, d: 234 },
  { name: 'Fleming', lat: 15.3, lon: 109.6, d: 126 },
  { name: 'Poczobutt', lat: -56.4, lon: -97.6, d: 222 },
  { name: 'Columbe', lat: -53.0, lon: -133.4, d: 132 },
  { name: 'Birkhoff', lat: -58.9, lon: -148.2, d: 331 },
  // Region polaire sud (sites Artemis / CLPS)
  { name: 'Shackleton', lat: -89.9, lon: 0, d: 21, style: 'rim' },
  { name: 'de Gerlache', lat: -88.5, lon: -31.7, d: 30 },
  { name: 'Haworth', lat: -86.9, lon: -4.1, d: 51 },
  { name: 'Shoemaker', lat: -88.1, lon: 44.9, d: 39 },
  { name: 'Faustini', lat: -85.9, lon: 89.1, d: 39 },
  { name: 'Amundsen', lat: -84.5, lon: 82.8, d: 105 },
  { name: 'Scott', lat: -85.7, lon: 40.9, d: 99 },
  { name: 'Nobile', lat: -85.6, lon: 54.6, d: 73 },
  { name: 'Wiechert', lat: -86.6, lon: 146.5, d: 51 },
  { name: 'Cabeus', lat: -84.9, lon: -35.5, d: 98 },
  { name: 'Malapert', lat: -84.9, lon: 11.0, d: 69 },
  { name: 'Moretus', lat: -70.7, lon: -5.8, d: 78 },
  { name: 'Curtius', lat: -67.4, lon: 4.2, d: 99 },
  { name: 'Newton', lat: -76.7, lon: -17.5, d: 78 },
];

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

export interface MoonMapAssets {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const cache = new Map<number, MoonMapAssets>();

/** Longueur d'arc pour 360 deg de longitude (km) — rayon moyen lunaire. */
const MOON_CIRC_KM = 2 * Math.PI * 1737.4;

/** Convertit lon/lat (deg) -> pixels canvas de la carte equirectangulaire. */
export function lonLatToXY(lon: number, lat: number, W: number, H: number): { x: number; y: number } {
  return {
    x: ((lon + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  };
}

/**
 * Genere (et met en cache) la carte lunaire equirectangulaire.
 * @param size largeur en px (hauteur = size/2)
 */
export function getMoonCanvas(size = 2048): MoonMapAssets {
  const cached = cache.get(size);
  if (cached) return cached;

  const W = size;
  const H = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  /* 1) Base regolithe : bruit fractal a demi-resolution puis agrandie. */
  const bw = Math.max(512, Math.min(1024, W / 2));
  const bh = bw / 2;
  const base = document.createElement('canvas');
  base.width = bw;
  base.height = bh;
  const bctx = base.getContext('2d')!;
  const img = bctx.createImageData(bw, bh);
  const data = img.data;
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      // coordonnees continuite horizontale : echelle en fonction de cos(lat)
      const lat = 90 - ((y + 0.5) / bh) * 180;
      const sq = Math.max(0.25, Math.cos((lat * Math.PI) / 180));
      const nx = (x / bw) * 900 * sq;
      const ny = (y / bh) * 450;
      const coarse = fbm(nx * 0.05, ny * 0.05, 911, 4);
      const fine = fbm(nx * 0.32, ny * 0.32, 377, 3);
      let v = 0.735 + (coarse - 0.5) * 0.16 + (fine - 0.5) * 0.1;
      // hauts plateaux du sud legerement plus clairs
      v += Math.max(0, (-lat - 30) / 60) * 0.045;
      v = Math.min(0.92, Math.max(0.52, v));
      const g = Math.round(v * 255);
      const i = (y * bw + x) * 4;
      data[i] = g;
      data[i + 1] = g;
      data[i + 2] = Math.min(255, g + 3);
      data[i + 3] = 255;
    }
  }
  bctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(base, 0, 0, W, H);

  /* 2) Mers : amas d'ellipses a bord doux (dessine en x, x-W, x+W pour la continuite). */
  const drawWrapped = (draw: (dx: number) => void) => {
    draw(0);
    draw(-W);
    draw(W);
  };

  const mareBlob = (cx: number, cy: number, r: number, strength: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `rgba(74,76,86,${0.5 * strength})`);
    grad.addColorStop(0.62, `rgba(80,82,92,${0.42 * strength})`);
    grad.addColorStop(1, 'rgba(90,92,102,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  for (const m of MARIA) {
    const rng = mulberry32(Math.round((m.lon + 180) * 1000 + (90 - m.lat) * 10));
    const { x, y } = lonLatToXY(m.lon, m.lat, W, H);
    const rx = (m.rx / 360) * W;
    const ry = (m.ry / 180) * H;
    const rot = m.rot ?? 0;
    for (let b = 0; b < m.blobs; b++) {
      const t = (b / m.blobs) * Math.PI * 2 + rng() * 0.9;
      const dist = rng() * 0.72;
      const bx = x + (Math.cos(t) * dist * rx + rng() * 6) * Math.cos(rot) - (Math.sin(t) * dist * ry) * Math.sin(rot);
      const by = y + (Math.cos(t) * dist * rx + rng() * 6) * Math.sin(rot) + (Math.sin(t) * dist * ry) * Math.cos(rot);
      const br = (0.42 + rng() * 0.5) * Math.max(rx, ry);
      const s = m.strength * (0.6 + rng() * 0.5);
      drawWrapped((dx) => mareBlob(bx + dx, by, br, s));
    }
    // coeur dense
    drawWrapped((dx) => mareBlob(x + dx, y, Math.max(rx, ry) * 0.78, m.strength * 0.9));
  }

  /* 3) Crateres nommes. */
  const pxPerKm = W / MOON_CIRC_KM;
  for (const c of CRATERS) {
    const rng = mulberry32(Math.round((c.lon + 180) * 733 + (90 - c.lat) * 17));
    const { x, y } = lonLatToXY(c.lon, c.lat, W, H);
    // rayon reel + exageration visuelle des petits crateres
    const realR = (c.d / 2) * pxPerKm;
    const r = Math.max(realR, 2.2) * (realR < 12 ? 1.9 : realR < 28 ? 1.35 : 1);
    const ry = r * Math.max(0.42, Math.cos((c.lat * Math.PI) / 180)); // distorsion latitudinale

    // Halo d'ejecta + rayons pour les cratères jeunes
    if (c.style === 'rays') {
      const rays = 12 + Math.floor(rng() * 6);
      const len = r * (4.5 + rng() * 3);
      ctx.save();
      ctx.translate(x, y);
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2 + rng() * 0.4;
        const l = len * (0.5 + rng() * 0.7);
        const wdt = Math.max(1.2, r * 0.16 * (0.5 + rng()));
        const g = ctx.createLinearGradient(0, 0, Math.cos(a) * l, Math.sin(a) * l);
        g.addColorStop(0, 'rgba(235,235,232,0.30)');
        g.addColorStop(1, 'rgba(235,235,232,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * l - Math.sin(a) * wdt, Math.sin(a) * l - Math.cos(a) * wdt);
        ctx.lineTo(Math.cos(a) * l + Math.sin(a) * wdt, Math.sin(a) * l + Math.cos(a) * wdt);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if (c.style === 'bright') {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
      g.addColorStop(0, 'rgba(240,240,238,0.5)');
      g.addColorStop(1, 'rgba(240,240,238,0)');
      ctx.fillStyle = g;
      drawWrapped((dx) => {
        ctx.beginPath();
        ctx.arc(x + dx, y, r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    for (const dx of [0, -W, W]) {
      const cx = x + dx;
      // plancher
      const floorRy = ry * 0.82;
      const floor = ctx.createRadialGradient(cx, y, 0, cx, y, Math.max(r, floorRy));
      const floorDark = c.style === 'dark' ? 0.5 : 0.2;
      floor.addColorStop(0, `rgba(52,52,58,${floorDark})`);
      floor.addColorStop(0.8, `rgba(52,52,58,${floorDark * 0.75})`);
      floor.addColorStop(1, 'rgba(52,52,58,0)');
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(1, Math.max(0.42, ry / r));
      ctx.fillStyle = floor;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      // couronne (rim) : anneau sombre + accroche claire cote lumiere
      ctx.strokeStyle = 'rgba(30,30,34,0.55)';
      ctx.lineWidth = Math.max(0.8, r * 0.09);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(238,238,235,0.5)';
      ctx.lineWidth = Math.max(0.7, r * 0.07);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.98, Math.PI * 0.95, Math.PI * 1.85);
      ctx.stroke();
      // pic central pour les grands
      if (r > 16 && c.style !== 'dark') {
        ctx.fillStyle = 'rgba(200,200,198,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.12, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /* 4) Crateres proceduraux mineurs (grain). */
  const rngM = mulberry32(778899);
  for (let i = 0; i < 460; i++) {
    const lon = rngM() * 360 - 180;
    const lat = (rngM() * 2 - 1) * 88;
    const { x, y } = lonLatToXY(lon, lat, W, H);
    const r = 1 + Math.pow(rngM(), 2.4) * 7;
    const ry = r * Math.max(0.45, Math.cos((lat * Math.PI) / 180));
    for (const dx of [0, -W, W]) {
      ctx.strokeStyle = `rgba(210,210,208,${0.14 + rngM() * 0.14})`;
      ctx.lineWidth = Math.max(0.5, r * 0.18);
      ctx.beginPath();
      ctx.ellipse(x + dx, y, r, ry, 0, Math.PI * 0.9, Math.PI * 1.95);
      ctx.stroke();
      ctx.fillStyle = `rgba(40,40,46,${0.1 + rngM() * 0.12})`;
      ctx.beginPath();
      ctx.ellipse(x + dx, y, r * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* 5) Leger vignettage polaire (compression visible). */
  const vTop = ctx.createLinearGradient(0, 0, 0, H * 0.06);
  vTop.addColorStop(0, 'rgba(120,122,128,0.35)');
  vTop.addColorStop(1, 'rgba(120,122,128,0)');
  ctx.fillStyle = vTop;
  ctx.fillRect(0, 0, W, H * 0.06);
  const vBot = ctx.createLinearGradient(0, H * 0.94, 0, H);
  vBot.addColorStop(0, 'rgba(120,122,128,0)');
  vBot.addColorStop(1, 'rgba(120,122,128,0.35)');
  ctx.fillStyle = vBot;
  ctx.fillRect(0, H * 0.94, W, H * 0.06);

  const assets = { canvas, width: W, height: H };
  cache.set(size, assets);
  return assets;
}

/* ------------------------------------------------------------------ */
/* Couleurs des marqueurs (partagees globe + carte)                    */
/* ------------------------------------------------------------------ */

export const MARKER_COLORS = {
  polaire: '#fbbf24', // ambre — sites CLPS / Artemis
  mission: '#34d399', // emeraude — missions reelles
} as const;
