# Texture du globe lunaire

`moon_equirect.jpg` (2048 × 1024) : carte lunaire équirectangulaire 2:1 (bord gauche = 180° O, équateur au milieu),
chargée par `src/components/globe/MoonGlobe.tsx` (code repris du prototype lunascope-mui de Fredy).

Source : Solar System Scope, « 2k Moon » — https://www.solarsystemscope.com/textures/
Licence : **CC BY 4.0** (attribution obligatoire, faite dans la légende du globe et la page « Données et limites »).
La texture est construite d'après les données NASA LRO.

Si le fichier est absent, le globe se rabat automatiquement sur la texture procédurale (`src/lib/moon-texture.ts`)
et la légende l'indique (« texture du sol illustrative »).
