# Texture du globe lunaire

`moon_equirect.jpg` : mosaïque lunaire équirectangulaire 2:1 (bord gauche = 180° O, équateur au milieu),
chargée par `src/components/globe/MoonGlobe.tsx` (code repris du prototype lunascope-mui de Fredy).

Source recommandée : NASA SVS, **CGI Moon Kit** (https://svs.gsfc.nasa.gov/4720), couleur LROC WAC,
fichier `lroc_color_poles_2k` ou `_4k` converti en JPEG. Domaine public (NASA / GSFC / Arizona State University).

Si le fichier est absent, le globe se rabat automatiquement sur la texture procédurale (`src/lib/moon-texture.ts`)
et la légende l'indique (« texture du sol illustrative »).
