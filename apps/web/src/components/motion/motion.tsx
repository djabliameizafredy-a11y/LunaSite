'use client';
import { keyframes } from '@mui/material/styles';
import Box, { type BoxProps } from '@mui/material/Box';

/**
 * Langage de mouvement LunaSite.
 * Moment signature (accueil seulement) : le titre « se lève » au-dessus d'une ligne d'horizon, comme un astre.
 * Ailleurs : fondus courts qui signalent l'arrivée des résultats, sans chorégraphie de chargement.
 * Réduire les animations : aucun déplacement, fondus seulement.
 */
export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

const rise = keyframes`from { transform: translateY(105%); } to { transform: translateY(0); }`;
const fade = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const fadeUp = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; }`;
const draw = keyframes`from { transform: scaleX(0); } to { transform: scaleX(1); }`;

/** Une ligne de titre qui monte depuis sous l'horizon (masquée par son conteneur). */
export function RiseLine({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Box component="span" sx={{ display: 'block', overflow: 'clip', pb: '0.08em' }}>
      <Box component="span" sx={{
        display: 'block',
        animation: `${rise} 760ms ${EASE_OUT} ${delay}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: `${fade} 300ms ease-out ${delay}ms both` },
      }}>
        {children}
      </Box>
    </Box>
  );
}

/** La ligne d'horizon : tracée de gauche à droite juste avant que le titre ne se lève. */
export function HorizonLine({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <Box aria-hidden="true" sx={{
      height: '1px', width: '100%', maxWidth: 520, mt: -1.5, transformOrigin: 'left center',
      background: `linear-gradient(90deg, ${color} 0%, ${color} 40%, transparent 100%)`,
      animation: `${draw} 900ms ${EASE_OUT} ${delay}ms both`,
      '@media (prefers-reduced-motion: reduce)': { animation: `${fade} 300ms ease-out both` },
    }} />
  );
}

/** Fondu d'apparition (résultats chargés, texte secondaire). `index` décale légèrement les éléments d'une liste. */
export function FadeIn({ index = 0, delay = 0, sx, ...rest }: BoxProps & { index?: number; delay?: number }) {
  const d = delay + Math.min(index, 4) * 40; // décalage plafonné : une liste, pas une cascade
  return (
    <Box {...rest} sx={[{
      animation: `${fadeUp} 260ms ${EASE_OUT} ${d}ms both`,
      '@media (prefers-reduced-motion: reduce)': { animation: `${fade} 200ms ease-out ${d}ms both` },
    }, ...(Array.isArray(sx) ? sx : [sx])]} />
  );
}
