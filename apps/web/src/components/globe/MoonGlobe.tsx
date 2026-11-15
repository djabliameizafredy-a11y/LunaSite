'use client';
/**
 * Globe lunaire 3D (adapté du prototype de l'équipe, scene/moon-globe-view.tsx).
 *  - Texture : mosaïque NASA LROC WAC (public/textures/moon_equirect.jpg), chargée comme dans le prototype de Fredy
 *    (lunascope-mui, moon-globe.tsx : TextureLoader, sRGB, anisotropie 8, bumpMap = même image).
 *    Si l'image manque, repli sur la texture procédurale (lib/moon-texture), signalé dans la légende.
 *  - Éclairage placé au point subsolaire calculé par l'API (/api/moon/geometry) : le terminateur jour/nuit est réel.
 *  - Lumière cendrée depuis le point subterrestre. Sites du catalogue cliquables.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { MoonGeometry, Site } from '@lunasite/shared-types';
import { getMoonCanvas } from '@/lib/moon-texture';

const SUN = '#fbbf24';
const EARTH = '#60a5fa';
const SITE = '#e5e7eb';

/** Mosaïque équirectangulaire (bord gauche = 180° O, comme le mapping UV de SphereGeometry). */
export const MOON_TEXTURE_URL = '/textures/moon_equirect.jpg';
export type TextureSource = 'nasa' | 'procedural';

/** Chargement de texture repris de lunascope-mui (Fredy), avec repli procédural en cas d'échec. */
function useMoonTexture(onSource?: (s: TextureSource) => void) {
  const [state, setState] = useState<{ tex: THREE.Texture; source: TextureSource } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let current: THREE.Texture | null = null;
    const use = (t: THREE.Texture, source: TextureSource) => {
      if (cancelled) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      current = t;
      setState({ tex: t, source });
      onSource?.(source);
    };
    new THREE.TextureLoader().load(
      MOON_TEXTURE_URL,
      (loaded) => use(loaded, 'nasa'),
      undefined,
      () => use(new THREE.CanvasTexture(getMoonCanvas(2048).canvas), 'procedural'),
    );
    return () => { cancelled = true; current?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

/** lat/lon (°, longitude Est) -> vecteur THREE, cohérent avec le mapping UV équirectangulaire (bord gauche = 180° O). */
export function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function labelTexture(text: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.font = '600 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 48);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Label({ text, color, position, width = 0.5 }: { text: string; color: string; position: THREE.Vector3; width?: number }) {
  const map = useMemo(() => labelTexture(text, color), [text, color]);
  return (
    <sprite position={position} scale={[width, width * 0.1875, 1]} renderOrder={10}>
      <spriteMaterial map={map} transparent depthWrite={false} />
    </sprite>
  );
}

export interface MoonGlobeProps {
  sites: Site[];
  selectedId: string;
  onSelect: (id: string) => void;
  geometry: MoonGeometry | null;
  labels: { sun: string; earth: string };
  /** Appelé quand la texture est prête : mosaïque NASA ou repli procédural. */
  onTextureSource?: (s: TextureSource) => void;
}

function Scene({ sites, selectedId, onSelect, geometry, labels, autoRotate, onTextureSource }: MoonGlobeProps & { autoRotate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const [hovered, setHovered] = useState<string | null>(null);

  const moon = useMoonTexture(onTextureSource);
  // Relief simulé : valeur du prototype de Fredy pour la mosaïque NASA, plus douce pour la texture procédurale.
  const bumpScale = moon?.source === 'nasa' ? 0.06 : 0.015;

  const sunDir = geometry ? latLonToVec3(geometry.subSolar.latDeg, geometry.subSolar.lonDeg, 1) : new THREE.Vector3(1, 0.2, 1).normalize();
  const earthDir = geometry ? latLonToVec3(geometry.subEarth.latDeg, geometry.subEarth.lonDeg, 1) : new THREE.Vector3(-1, 0, 0);

  // Cadrage initial : vue oblique sur le pôle Sud, côté Terre (là où sont les sites candidats).
  useEffect(() => {
    camera.position.copy(latLonToVec3(-48, 10, 3.1));
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  }, [camera]);

  useFrame((_, dt) => { if (autoRotate && group.current) group.current.rotation.y += 0.05 * dt; });

  const selected = sites.find((s) => s.id === selectedId);

  return (
    <>
      <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.08} rotateSpeed={0.55} minDistance={1.35} maxDistance={7} />
      <group ref={group}>
        {/* Les lumières tournent avec le globe : le terminateur reste collé à la surface. */}
        <directionalLight position={sunDir.clone().multiplyScalar(20)} intensity={3} color="#fff4e0" />
        <directionalLight position={earthDir.clone().multiplyScalar(20)} intensity={0.18} color="#9cc3ff" />
        <ambientLight intensity={0.06} />

        {moon && (
          <mesh>
            <sphereGeometry args={[1, 128, 128]} />
            <meshStandardMaterial map={moon.tex} bumpMap={moon.tex} bumpScale={bumpScale} roughness={1} metalness={0} />
          </mesh>
        )}

        {geometry && (
          <>
            <mesh position={sunDir.clone().multiplyScalar(1.01)}><sphereGeometry args={[0.018, 12, 12]} /><meshBasicMaterial color={SUN} toneMapped={false} /></mesh>
            <Label text={labels.sun} color={SUN} position={sunDir.clone().multiplyScalar(1.1)} width={0.62} />
            <mesh position={earthDir.clone().multiplyScalar(1.01)}><sphereGeometry args={[0.016, 12, 12]} /><meshBasicMaterial color={EARTH} toneMapped={false} /></mesh>
            <Label text={labels.earth} color={EARTH} position={earthDir.clone().multiplyScalar(1.1)} width={0.62} />
          </>
        )}

        {sites.map((s) => {
          const active = s.id === selectedId;
          const hot = s.id === hovered;
          return (
            <mesh key={s.id} position={latLonToVec3(s.latitude, s.longitude, 1.006)}
              onClick={(e) => { e.stopPropagation(); onSelect(s.id); }}
              onPointerOver={(e) => { e.stopPropagation(); setHovered(s.id); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { setHovered(null); document.body.style.cursor = ''; }}>
              <sphereGeometry args={[active ? 0.02 : hot ? 0.017 : 0.012, 16, 16]} />
              <meshBasicMaterial color={active ? SUN : SITE} toneMapped={false} />
            </mesh>
          );
        })}
        {selected && <Label text={selected.name.split(' — ')[0]} color="#ffffff" position={latLonToVec3(selected.latitude, selected.longitude, 1.09)} width={0.75} />}
        {hovered && hovered !== selectedId && (() => {
          const h = sites.find((s) => s.id === hovered);
          return h ? <Label text={h.name.split(' — ')[0]} color="#d1d5db" position={latLonToVec3(h.latitude, h.longitude, 1.09)} width={0.65} /> : null;
        })()}
      </group>
    </>
  );
}

export default function MoonGlobe(props: MoonGlobeProps) {
  const [autoRotate] = useState(false);
  return (
    <Canvas camera={{ fov: 40, near: 0.05, far: 100, position: [0, -2, 2.4] }} gl={{ antialias: true }} style={{ width: '100%', height: '100%', background: '#000' }}>
      <color attach="background" args={['#000']} />
      <Scene {...props} autoRotate={autoRotate} />
    </Canvas>
  );
}
