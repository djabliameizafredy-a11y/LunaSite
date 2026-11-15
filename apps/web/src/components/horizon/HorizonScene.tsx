'use client';
/**
 * Vue horizon 3D : l'observateur est debout sur le site (yeux à 1,7 m).
 * Adapté de la scène de l'équipe (sim/horizon-scene.tsx) : Soleil, Terre (phase éclairée), lumière, graticule.
 * Différence clé : la ligne de crête n'est pas inventée, elle est construite à partir du profil d'horizon
 * LOLA (360 élévations) renvoyé par l'API. Elle est plus proche que le Soleil et la Terre : quand l'un d'eux
 * passe sous le relief, il est réellement masqué dans la scène.
 */
import { memo, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface LookState { yaw: number; pitch: number; fov: number }
export interface BodyState { az: number; el: number }

export interface HorizonSceneProps {
  sun: BodyState;
  earth: BodyState;
  /** Profil LOLA (élévation par azimut, pas uniforme depuis le Nord vers l'Est) ; null = horizon plat. */
  skyline: number[] | null;
  exaggeration: number;
  look: React.MutableRefObject<LookState>;
  showGrid: boolean;
  cardinals?: { N: string; E: string; S: string; W: string };
}

const D2R = Math.PI / 180;
const SKY_R = 900; // distance d'affichage du Soleil et de la Terre
const RIDGE_R = 820; // la crête est devant eux : elle peut les masquer
const EYE = 1.7;
const SUN_DIAM_DEG = 0.53;
const EARTH_DIAM_DEG = 1.9;

// Repère de scène : X = Est, Y = haut, −Z = Nord (azimut compté depuis le Nord vers l'Est).
export const dirFrom = (azDeg: number, elDeg: number, r = 1) =>
  new THREE.Vector3(
    r * Math.cos(elDeg * D2R) * Math.sin(azDeg * D2R),
    r * Math.sin(elDeg * D2R),
    -r * Math.cos(elDeg * D2R) * Math.cos(azDeg * D2R),
  );

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

function CameraRig({ look }: { look: React.MutableRefObject<LookState> }) {
  const { camera } = useThree();
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.rotation.order = 'YXZ';
    cam.rotation.y = -look.current.yaw * D2R;
    cam.rotation.x = look.current.pitch * D2R;
    if (cam.fov !== look.current.fov) { cam.fov = look.current.fov; cam.updateProjectionMatrix(); }
  });
  return null;
}

/** Sol proche : régolithe (texture de grain, purement visuelle) jusqu'au pied de la crête. */
function Ground({ y }: { y: number }) {
  const tex = useMemo(() => {
    const t = canvasTexture(512, 512, (ctx) => {
      const r = rng(7);
      ctx.fillStyle = '#7d7d7d';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9000; i++) {
        const g = 85 + Math.floor(r() * 85);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(90, 90);
    t.anisotropy = 8;
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <circleGeometry args={[RIDGE_R + 2, 96]} />
      <meshStandardMaterial map={tex} roughness={1} metalness={0} />
    </mesh>
  );
}

/** Crête LOLA : une bande verticale par pas d'azimut, du sol jusqu'à l'élévation de l'horizon mesurée. */
function Ridge({ skyline, groundY }: { skyline: number[]; groundY: number }) {
  const { geometry, line } = useMemo(() => {
    const n = skyline.length;
    const pos: number[] = [];
    const idx: number[] = [];
    const crest: number[] = [];
    for (let i = 0; i <= n; i++) {
      const az = (i * 360) / n;
      const el = skyline[i % n];
      const x = RIDGE_R * Math.sin(az * D2R);
      const z = -RIDGE_R * Math.cos(az * D2R);
      const yTop = EYE + RIDGE_R * Math.tan(el * D2R);
      pos.push(x, groundY - 1, z, x, yTop, z);
      crest.push(x * 0.999, yTop + 0.4, z * 0.999);
      if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const l = new THREE.BufferGeometry();
    l.setAttribute('position', new THREE.Float32BufferAttribute(crest, 3));
    return { geometry: g, line: l };
  }, [skyline, groundY]);
  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#8a8a8a" roughness={1} side={THREE.DoubleSide} flatShading />
      </mesh>
      <line>
        <primitive object={line} attach="geometry" />
        <lineBasicMaterial color="#fbbf24" transparent opacity={0.75} />
      </line>
    </group>
  );
}

/** Horizon plat (site sans relief chargé) : simple ligne à 0°. */
function FlatHorizon() {
  const line = useMemo(() => {
    const pts: number[] = [];
    for (let az = 0; az <= 360; az += 2) { const v = dirFrom(az, 0.05, RIDGE_R); pts.push(v.x, v.y + EYE, v.z); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <line>
      <primitive object={line} attach="geometry" />
      <lineBasicMaterial color="#fbbf24" transparent opacity={0.6} />
    </line>
  );
}

function Stars() {
  const geo = useMemo(() => {
    const r = rng(99);
    const n = 2500;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = r() * 2 - 1;
      const t = r() * Math.PI * 2;
      const q = Math.sqrt(1 - u * u);
      p.set([1500 * q * Math.cos(t), 1500 * u, 1500 * q * Math.sin(t)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={1.5} sizeAttenuation={false} transparent opacity={0.8} />
    </points>
  );
}

function SunBody({ sun, exaggeration }: { sun: BodyState; exaggeration: number }) {
  const pos = dirFrom(sun.az, sun.el, SKY_R).add(new THREE.Vector3(0, EYE, 0));
  const radius = SKY_R * Math.tan((SUN_DIAM_DEG * D2R) / 2) * exaggeration;
  const glow = useMemo(() => canvasTexture(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,244,214,1)');
    g.addColorStop(0.25, 'rgba(255,214,120,0.55)');
    g.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }), []);
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color="#fff6d8" toneMapped={false} />
      </mesh>
      <sprite scale={[radius * 10, radius * 10, 1]}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} transparent toneMapped={false} />
      </sprite>
    </group>
  );
}

const EARTH_VERT = `
varying vec3 vN; varying vec2 vUv;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const EARTH_FRAG = `
uniform sampler2D map; uniform vec3 sunDir; varying vec3 vN; varying vec2 vUv;
void main(){
  float k = max(dot(normalize(vN), normalize(sunDir)), 0.0);
  vec3 c = texture2D(map, vUv).rgb;
  gl_FragColor = vec4(c * (0.03 + 0.97 * smoothstep(0.0, 0.18, k) * (0.35 + 0.65 * k)), 1.0);
}`;

/** Terre : texture schématique (non cartographique) ; la PHASE vient de la direction réelle du Soleil. */
function EarthBody({ earth, sun, exaggeration }: { earth: BodyState; sun: BodyState; exaggeration: number }) {
  const pos = dirFrom(earth.az, earth.el, SKY_R).add(new THREE.Vector3(0, EYE, 0));
  const radius = SKY_R * Math.tan((EARTH_DIAM_DEG * D2R) / 2) * exaggeration;
  const map = useMemo(() => canvasTexture(512, 256, (ctx) => {
    const r = rng(5);
    ctx.fillStyle = '#1c4f9c';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#3f7d3a';
    for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.ellipse(r() * 512, 40 + r() * 176, 14 + r() * 38, 8 + r() * 24, r() * 3, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.ellipse(r() * 512, r() * 256, 10 + r() * 40, 3 + r() * 9, r() * 3, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = '#f2f6fa';
    ctx.fillRect(0, 0, 512, 12);
    ctx.fillRect(0, 244, 512, 12);
  }), []);
  const uniforms = useMemo(() => ({ map: { value: map }, sunDir: { value: new THREE.Vector3() } }), [map]);
  uniforms.sunDir.value.copy(dirFrom(sun.az, sun.el, 1));
  return (
    <mesh position={pos}>
      <sphereGeometry args={[radius, 48, 48]} />
      <shaderMaterial uniforms={uniforms} vertexShader={EARTH_VERT} fragmentShader={EARTH_FRAG} />
    </mesh>
  );
}

/** Soleil + lumière cendrée : la Terre éclaire le sol lunaire depuis sa direction réelle quand elle est levée. */
function Lights({ sun, earth }: { sun: BodyState; earth: BodyState }) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const earthRef = useRef<THREE.DirectionalLight>(null);
  const up = Math.max(0, Math.min(1, (sun.el + 0.3) / 1.2));
  const earthUp = Math.max(0, Math.min(1, (earth.el + 1) / 3));
  useEffect(() => { sunRef.current?.target.position.set(0, 0, 0); earthRef.current?.target.position.set(0, 0, 0); }, []);
  return (
    <>
      <directionalLight ref={sunRef} position={dirFrom(sun.az, Math.max(sun.el, 0.5), 80)} intensity={3.2 * up} color="#fff4e0" />
      <directionalLight ref={earthRef} position={dirFrom(earth.az, Math.max(earth.el, 2), 80)} intensity={0.9 * earthUp} color="#a9c4ff" />
      {/* ambiance de lisibilité (illustrative) : sans elle, la crête est noire dès que le Soleil est couché */}
      <hemisphereLight args={['#9aa8c8', '#4a4a4a', 1.4]} />
    </>
  );
}

/** Étiquette dessinée dans la scène (sprite) : pas de racine React par étiquette. */
function Label({ az, text, big }: { az: number; text: string; big: boolean }) {
  const map = useMemo(() => canvasTexture(128, 64, (ctx) => {
    ctx.font = `${big ? 700 : 500} ${big ? 40 : 28}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = big ? '#fbbf24' : 'rgba(255,255,255,0.75)';
    ctx.fillText(text, 64, 32);
  }), [text, big]);
  const pos = dirFrom(az, 1.4, 860).add(new THREE.Vector3(0, EYE, 0));
  return (
    <sprite position={pos} scale={[big ? 96 : 72, big ? 48 : 36, 1]} renderOrder={10}>
      <spriteMaterial map={map} transparent depthWrite={false} depthTest={false} />
    </sprite>
  );
}

const Graticule = memo(function Graticule({ cardinals }: { cardinals: { N: string; E: string; S: string; W: string } }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const seg = (a: THREE.Vector3, b: THREE.Vector3) => pts.push(a.x, a.y + EYE, a.z, b.x, b.y + EYE, b.z);
    const R = 860;
    for (let az = 0; az < 360; az += 30) for (let el = 0; el < 85; el += 5) seg(dirFrom(az, el, R), dirFrom(az, el + 5, R));
    for (const el of [5, 10, 20, 30, 45, 60]) for (let az = 0; az < 360; az += 5) seg(dirFrom(az, el, R), dirFrom(az + 5, el, R));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#8fb4ff" transparent opacity={0.16} depthWrite={false} />
      </lineSegments>
      {[{ az: 0, t: cardinals.N }, { az: 90, t: cardinals.E }, { az: 180, t: cardinals.S }, { az: 270, t: cardinals.W }].map((l) => <Label key={l.az} az={l.az} text={l.t} big />)}
      {[30, 60, 120, 150, 210, 240, 300, 330].map((a) => <Label key={a} az={a} text={`${a}°`} big={false} />)}
    </group>
  );
});

export default function HorizonScene({ sun, earth, skyline, exaggeration, look, showGrid, cardinals = { N: 'N', E: 'E', S: 'S', W: 'O' } }: HorizonSceneProps) {
  // Sur un sommet, l'horizon descend sous 0° : le sol visible est plus bas que les yeux de l'observateur.
  const groundY = useMemo(() => Math.min(0, ...(skyline ?? [0]).map((e) => EYE + RIDGE_R * Math.tan(e * D2R) - 2)), [skyline]);
  return (
    <Canvas camera={{ fov: look.current.fov, near: 0.1, far: 4000, position: [0, EYE, 0] }} gl={{ antialias: true }}
      style={{ height: '100%', width: '100%', background: '#000' }} aria-hidden="true">
      <color attach="background" args={['#000']} />
      <CameraRig look={look} />
      <Stars />
      <Lights sun={sun} earth={earth} />
      <SunBody sun={sun} exaggeration={exaggeration} />
      <EarthBody earth={earth} sun={sun} exaggeration={exaggeration} />
      <Ground y={groundY} />
      {skyline ? <Ridge skyline={skyline} groundY={groundY} /> : <FlatHorizon />}
      {showGrid && <Graticule cardinals={cardinals} />}
    </Canvas>
  );
}
