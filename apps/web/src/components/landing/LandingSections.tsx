'use client';
import { useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LandscapeRoundedIcon from '@mui/icons-material/LandscapeRounded';
import { SERIES } from '@/theme/theme';

const MEASURE = '62ch';

/* ------------------------------------------------------------------ */
/* La Lune entière (vidéo des phases), puis pourquoi le pôle Sud        */
/* ------------------------------------------------------------------ */

/** Vidéo sous la ligne de flottaison : chargée et lue seulement quand elle devient visible, jamais si « réduire les animations ». */
function PhasesVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reduce.matches) void v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <Box component="video" ref={ref} src="/media/moon-phases.mp4" poster="/media/moon-phases.jpg"
      width={1280} height={720} muted loop playsInline preload="none" aria-label="Animation : les phases de la Lune vues depuis la Terre"
      {...({ loading: 'lazy' } as object)}
      sx={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 2, bgcolor: '#000' }} />
  );
}

export function MoonSection() {
  return (
    <Box component="section" aria-labelledby="moon-title" sx={{ bgcolor: '#000', color: '#fff', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 8 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}><PhasesVideo /></Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography id="moon-title" component="h2" sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' }, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', textWrap: 'balance' }}>
              Vue d'ici, la Lune change de phase. Vue du pôle Sud, c'est le relief qui décide.
            </Typography>
            <Typography sx={{ mt: 2.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, maxWidth: MEASURE }}>
              L'axe de la Lune est presque droit : au pôle Sud, le Soleil ne monte jamais à plus d'environ 1,5° au-dessus de
              l'horizon. Il rase le sol et tourne autour du site. Une crête de quelques centaines de mètres suffit à le cacher,
              et la Terre suit la même règle.
            </Typography>
            <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, maxWidth: MEASURE }}>
              LunaSite calcule, pour chaque site et chaque date, si le Soleil et la Terre passent au-dessus du vrai relief mesuré
              par la NASA.
            </Typography>
            <Button component={NextLink} href="/horizon" variant="contained" startIcon={<LandscapeRoundedIcon />} sx={{ mt: 3.5 }}>
              Voir l'horizon en 3D
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Ce sur quoi reposent les chiffres (trust statements)                 */
/* ------------------------------------------------------------------ */

const TRUST = [
  { k: 'Relief NASA LOLA', v: "Modèle de terrain du Lunar Reconnaissance Orbiter, 80 m par pixel, profil d'horizon sur 360°." },
  { k: 'Validé contre JPL Horizons', v: 'Positions du Soleil et de la Terre comparées aux éphémérides officielles de la NASA.' },
  { k: 'Chaque chiffre sourcé', v: "Niveau de calcul affiché partout : relief LOLA, horizon plat ou démo. Jamais de valeur inventée." },
  { k: 'Sans compte, sans cookie', v: 'Aucune inscription, aucune donnée personnelle collectée. Le code source est public.' },
];

export function TrustSection() {
  return (
    <Container maxWidth="lg" component="section" aria-labelledby="trust-title" sx={{ py: { xs: 7, md: 10 } }}>
      <Typography id="trust-title" component="h2" variant="h4" sx={{ fontWeight: 700, mb: 4, textWrap: 'balance', maxWidth: '24ch' }}>
        Des chiffres que l'on peut vérifier
      </Typography>
      <Box component="dl" sx={{ m: 0, display: 'grid', gap: { xs: 3, md: 4 }, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
        {TRUST.map((t, i) => (
          <Box key={t.k} sx={{ borderTop: '2px solid', borderColor: i % 2 ? SERIES.earth : SERIES.sun, pt: 2 }}>
            <Typography component="dt" variant="subtitle1" sx={{ fontWeight: 600 }}>{t.k}</Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.75, color: 'text.secondary', lineHeight: 1.65 }}>{t.v}</Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/* Le Canada vers la Lune (photos de l'Agence spatiale canadienne)      */
/* ------------------------------------------------------------------ */

const CSA_IMG = 'https://www.asc-csa.gc.ca/images/recherche/tiles/';
const CANADA = [
  { id: '92aa72a8-4750-4052-b46a-2c4a1845b440', alt: 'En route vers la Lune', caption: 'En route vers la Lune — mission Artemis II', wide: true },
  { id: '2ca5d15e-a9b2-4632-87a2-894c3f19d6c3', alt: 'Un moment avec la Terre, vue depuis Orion', caption: 'Un moment avec la Terre' },
  { id: '6b501faa-ee7b-4886-89a8-aaff86f1413e', alt: "Vérification des données sur les écrans d'Orion", caption: "Vérification des données sur les écrans d'Orion" },
  { id: '8620d987-c279-47be-aa9c-066f74b32e96', alt: 'La vie à bord d’Orion pendant Artemis II', caption: 'La vie à bord d’Orion pendant Artemis II' },
  { id: '5644b8f4-8c10-4bb0-abdc-1da0b364e7e1', alt: 'Conception préliminaire du spectromètre CANS', caption: 'Conception préliminaire du spectromètre canadien à neutrons actif (CANS)' },
];

function CsaFigure({ item }: { item: (typeof CANADA)[number] }) {
  const [failed, setFailed] = useState(false);
  return (
    <Box component="figure" sx={{ m: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative', aspectRatio: item.wide ? '16 / 9' : '4 / 3', borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', flex: item.wide ? 1 : undefined }}>
        {!failed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${CSA_IMG}${item.id}.jpg`} alt={item.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {failed && (
          <Typography variant="caption" sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, textAlign: 'center', color: 'text.secondary' }}>
            Image de l'ASC indisponible pour le moment.
          </Typography>
        )}
      </Box>
      <Typography component="figcaption" variant="body2" sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.5 }}>
        {item.caption} <Box component="span" sx={{ opacity: 0.7 }}>· Image : ASC</Box>
      </Typography>
    </Box>
  );
}

export function CanadaSection() {
  const [first, ...rest] = CANADA;
  return (
    <Box component="section" aria-labelledby="canada-title" sx={{ bgcolor: 'background.paper', borderBlock: '1px solid', borderColor: 'divider', py: { xs: 7, md: 10 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 2, md: 6 }} sx={{ mb: { xs: 3, md: 5 } }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography id="canada-title" component="h2" variant="h4" sx={{ fontWeight: 700, textWrap: 'balance' }}>
              Le Canada vers la Lune
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.7, maxWidth: MEASURE }}>
              Jeremy Hansen, astronaute de l'Agence spatiale canadienne, fait partie de l'équipage d'Artemis II, la mission
              habitée de la NASA autour de la Lune. Le Canada prépare aussi des instruments pour la surface lunaire, comme le
              spectromètre CANS. Le pôle Sud, que compare LunaSite, est la destination des prochaines missions Artemis.
            </Typography>
            <Link href="https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/" target="_blank" rel="noopener noreferrer" underline="hover"
              sx={{ display: 'inline-block', mt: 1.5 }}>
              L'exploration lunaire sur le site de l'ASC <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>(nouvel onglet)</Box>→
            </Link>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}><CsaFigure item={first} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container spacing={2}>
              {rest.map((it) => <Grid key={it.id} size={6}><CsaFigure item={it} /></Grid>)}
            </Grid>
          </Grid>
        </Grid>
        <Typography variant="caption" component="p" sx={{ mt: 3, color: 'text.secondary', maxWidth: '80ch' }}>
          Images : Agence spatiale canadienne (ASC), affichées depuis asc-csa.gc.ca avec leur légende d'origine traduite.
          LunaSite est un projet étudiant du NASA Space Apps Challenge : ce n'est pas un site officiel de la NASA ni de l'ASC.
        </Typography>
      </Container>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ (objections) + appel final                                       */
/* ------------------------------------------------------------------ */

const FAQ = [
  { q: 'LunaSite est-il un site officiel de la NASA ?',
    a: "Non. C'est un projet étudiant réalisé pour le NASA Space Apps Challenge 2026 (défi CLPS). Il utilise des données publiques de la NASA, citées sur chaque page." },
  { q: "D'où viennent les données ?",
    a: "Le relief vient du modèle LOLA (Lunar Reconnaissance Orbiter, NASA PDS). Les positions du Soleil et de la Terre sont calculées par un moteur d'éphémérides puis comparées à JPL Horizons. La page « Données et limites » détaille chaque source." },
  { q: 'Les résultats sont-ils fiables ?',
    a: "Les positions concordent avec JPL Horizons à environ un millième de degré sur les sites polaires. L'énergie est indicative et la visibilité de la Terre est géométrique : LunaSite aide à comparer, il ne remplace pas une étude de mission." },
  { q: 'Que veut dire « horizon plat » ?',
    a: "Pour certains sites, le relief n'est pas chargé : l'horizon est supposé plat. Ces résultats sont signalés en orange et peuvent être surestimés, car le relief masque souvent le Soleil et la Terre." },
  { q: 'Faut-il créer un compte ?',
    a: "Non. Il n'y a ni inscription, ni cookie, ni collecte de données personnelles. Seul le thème clair ou sombre choisi est mémorisé dans votre navigateur." },
];

export function FaqSection() {
  return (
    <Container maxWidth="md" component="section" aria-labelledby="faq-title" sx={{ py: { xs: 7, md: 10 } }}>
      <Typography id="faq-title" component="h2" variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Questions fréquentes</Typography>
      <Box>
        {FAQ.map((f) => (
          <Box key={f.q} component="details" sx={{ borderBottom: '1px solid', borderColor: 'divider',
            '&[open] .faq-chevron': { transform: 'rotate(180deg)' }, '& summary::-webkit-details-marker': { display: 'none' } }}>
            <Box component="summary" sx={{ listStyle: 'none', cursor: 'pointer', py: 2.25, display: 'flex', alignItems: 'center', gap: 2,
              fontWeight: 600, fontSize: '1.05rem', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: 1 } }}>
              <Box component="span" sx={{ mr: 'auto' }}>{f.q}</Box>
              <ExpandMoreRoundedIcon className="faq-chevron" aria-hidden="true" sx={{ color: 'text.secondary', transition: 'transform 200ms' }} />
            </Box>
            <Typography sx={{ pb: 2.5, color: 'text.secondary', lineHeight: 1.7, maxWidth: '68ch' }}>{f.a}</Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
}

export function FinalCta() {
  return (
    <Container maxWidth="lg" component="section" aria-labelledby="cta-title" sx={{ pb: { xs: 2, md: 4 } }}>
      <Box sx={{ borderRadius: 3, px: { xs: 3, md: 6 }, py: { xs: 5, md: 7 }, bgcolor: '#05070a', color: '#fff',
        backgroundImage: `radial-gradient(120% 140% at 100% 0%, rgba(251,191,36,0.16) 0%, rgba(5,7,10,0) 55%)` }}>
        <Typography id="cta-title" component="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: '22ch' }}>
          Choisissez un site, une date, et regardez le ciel.
        </Typography>
        <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.75)', maxWidth: '55ch' }}>
          13 sites candidats, du massif Malapert à Shackleton, comparés sur le Soleil, la Terre et l'énergie.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, mt: 3.5 }}>
          <Button component={NextLink} href="/dashboard" variant="contained" size="large" endIcon={<ChevronRightRoundedIcon />}>Explorer les sites</Button>
          <Button component={NextLink} href="/about" variant="outlined" size="large"
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}>
            Comment ça marche
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
