'use client';
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { Site } from '@lunasite/shared-types';
import { parallelRadius, SOUTH_POLE_IMAGE as IMG, southPolarStereo } from '@/lib/projection';
import { useT } from '@/i18n';

const ZOOMS = { pole: 230_000, region: 520_000 } as const; // demi-largeur de la vue, en mètres
const PARALLELS = [-80, -85, -88];
const MERIDIANS = [0, 90, 180, 270];

interface Props {
  sites: Site[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Hauteur de la carte en px (carré). */
  size?: number;
}

/**
 * Carte du pôle Sud : image LROC réelle (export QuickMap géoréférencé) + sites placés par projection stéréographique.
 * Tout est en mètres dans le repère de la projection ; l'axe y du SVG est inversé (nord de la carte = longitude 0°).
 */
export function SouthPoleMap({ sites, selectedId, onSelect, size = 360 }: Props) {
  const [zoom, setZoom] = useState<keyof typeof ZOOMS>('pole');
  const t = useT();
  const half = ZOOMS[zoom];

  const placed = useMemo(() => sites
    .map((s) => ({ s, ...southPolarStereo(s.latitude, s.longitude) }))
    .filter((p) => Math.abs(p.x) < half && Math.abs(p.y) < half), [sites, half]);
  const outside = sites.length - placed.length;

  const unit = half / 100; // taille de référence des symboles, proportionnelle au zoom
  const imgW = IMG.widthPx * IMG.pixelSize;
  const imgH = IMG.heightPx * IMG.pixelSize;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <div>
            <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600 }}>{t.map.title}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.map.count(placed.length)}</Typography>
          </div>
          <ToggleButtonGroup size="small" exclusive value={zoom} onChange={(_e, v) => v && setZoom(v)} aria-label={t.map.zoom}>
            <ToggleButton value="pole">± 230 km</ToggleButton>
            <ToggleButton value="region">± 520 km</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Box sx={{ width: '100%', maxWidth: size, mx: 'auto', aspectRatio: '1 / 1', borderRadius: 1, overflow: 'hidden', bgcolor: '#000',
          '& g[role="button"]:focus-visible': { outline: '3px solid #fff', outlineOffset: '3px' } }}>
          <svg viewBox={`${-half} ${-half} ${2 * half} ${2 * half}`} width="100%" height="100%" role="group"
            aria-label={t.map.aria(placed.length)}>
            <image href={IMG.src} x={IMG.originX} y={-IMG.originY} width={imgW} height={imgH} preserveAspectRatio="none" />
            <g fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={unit * 0.35} strokeDasharray={`${unit * 1.5} ${unit}`}>
              {PARALLELS.map((lat) => <circle key={lat} r={parallelRadius(lat)} />)}
              {MERIDIANS.map((lon) => { const p = southPolarStereo(-80, lon); return <line key={lon} x1={0} y1={0} x2={p.x * 3} y2={-p.y * 3} />; })}
            </g>
            <g fill="rgba(255,255,255,0.75)" fontSize={unit * 4.2} fontFamily="Inter, sans-serif">
              {PARALLELS.filter((lat) => parallelRadius(lat) < half * 0.95).map((lat) => (
                <text key={lat} x={unit * 1.5} y={parallelRadius(lat) - unit * 1.5}>{Math.abs(lat)}° {t.map.south}</text>
              ))}
              <text x={unit * 1.5} y={-half + unit * 6}>0°</text>
              <text x={half - unit * 12} y={-unit * 1.5}>90° {t.map.east}</text>
            </g>
            {placed.map(({ s, x, y }) => {
              const active = s.id === selectedId;
              return (
                <g key={s.id} transform={`translate(${x} ${-y})`} style={{ cursor: onSelect ? 'pointer' : undefined }}
                  onClick={() => onSelect?.(s.id)} role="button" aria-label={s.name} tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(s.id); } }}>
                  <circle r={unit * (active ? 3.4 : 2.4)} fill={active ? 'hsl(38, 92%, 55%)' : 'hsl(210, 100%, 62%)'} stroke="#fff" strokeWidth={unit * 0.6} />
                  <title>{`${s.name} — ${s.latitude.toFixed(2)}°, ${s.longitude.toFixed(2)}°E`}</title>
                  {(active || zoom === 'pole') && (
                    <text x={unit * 4} y={unit * 1.4} fontSize={unit * (active ? 4.6 : 3.6)} fill="#fff" fontWeight={active ? 700 : 500}
                      fontFamily="Inter, sans-serif" style={{ paintOrder: 'stroke' }} stroke="rgba(0,0,0,0.75)" strokeWidth={unit * 0.8}>
                      {s.name.split(' — ')[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </Box>

        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1 }}>
          {t.map.credit}. {t.map.placed}
          {outside > 0 && t.map.outside(outside)} {t.map.context}
        </Typography>
      </CardContent>
    </Card>
  );
}
