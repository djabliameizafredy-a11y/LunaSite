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
import { useT } from '@/i18n';

const MEASURE = '62ch';

/* ------------------------------------------------------------------ */
/* La Lune entière (vidéo des phases), puis pourquoi le pôle Sud        */
/* ------------------------------------------------------------------ */

/** Vidéo sous la ligne de flottaison : chargée et lue seulement quand elle devient visible, jamais si « réduire les animations ». */
function PhasesVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const t = useT();
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
      width={1280} height={720} muted loop playsInline preload="none" aria-label={t.home.moonVideoAria}
      {...({ loading: 'lazy' } as object)}
      sx={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 2, bgcolor: '#000' }} />
  );
}

export function MoonSection() {
  const t = useT();
  return (
    <Box component="section" aria-labelledby="moon-title" sx={{ bgcolor: '#000', color: '#fff', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 8 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}><PhasesVideo /></Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography id="moon-title" component="h2" sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' }, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', textWrap: 'balance' }}>
              {t.home.moonTitle}
            </Typography>
            <Typography sx={{ mt: 2.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, maxWidth: MEASURE }}>
              {t.home.moonP1}
            </Typography>
            <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, maxWidth: MEASURE }}>
              {t.home.moonP2}
            </Typography>
            <Button component={NextLink} href="/horizon" variant="contained" startIcon={<LandscapeRoundedIcon />} sx={{ mt: 3.5 }}>
              {t.home.moonCta}
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


export function TrustSection() {
  const t = useT();
  return (
    <Container maxWidth="lg" component="section" aria-labelledby="trust-title" sx={{ py: { xs: 7, md: 10 } }}>
      <Typography id="trust-title" component="h2" variant="h4" sx={{ fontWeight: 700, mb: 4, textWrap: 'balance', maxWidth: '24ch' }}>
        {t.home.trustTitle}
      </Typography>
      <Box component="dl" sx={{ m: 0, display: 'grid', gap: { xs: 3, md: 4 }, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
        {t.home.trust.map(([k, v], i) => (
          <Box key={k} sx={{ borderTop: '2px solid', borderColor: i % 2 ? SERIES.earth : SERIES.sun, pt: 2 }}>
            <Typography component="dt" variant="subtitle1" sx={{ fontWeight: 600 }}>{k}</Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.75, color: 'text.secondary', lineHeight: 1.65 }}>{v}</Typography>
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
const CANADA_IDS = [
  { id: '92aa72a8-4750-4052-b46a-2c4a1845b440', wide: true },
  { id: '2ca5d15e-a9b2-4632-87a2-894c3f19d6c3' },
  { id: '6b501faa-ee7b-4886-89a8-aaff86f1413e' },
  { id: '8620d987-c279-47be-aa9c-066f74b32e96' },
  { id: '5644b8f4-8c10-4bb0-abdc-1da0b364e7e1' },
];
type CsaItem = { id: string; wide?: boolean; alt: string; caption: string };

function CsaFigure({ item }: { item: CsaItem }) {
  const [failed, setFailed] = useState(false);
  const t = useT();
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
            {t.home.canadaImageDown}
          </Typography>
        )}
      </Box>
      <Typography component="figcaption" variant="body2" sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.5 }}>
        {item.caption} <Box component="span" sx={{ opacity: 0.7 }}>· {t.common.imageCsa}</Box>
      </Typography>
    </Box>
  );
}

export function CanadaSection() {
  const t = useT();
  const items: CsaItem[] = CANADA_IDS.map((it, i) => ({ ...it, alt: t.home.canadaImages[i][0], caption: t.home.canadaImages[i][1] }));
  const [first, ...rest] = items;
  return (
    <Box component="section" aria-labelledby="canada-title" sx={{ bgcolor: 'background.paper', borderBlock: '1px solid', borderColor: 'divider', py: { xs: 7, md: 10 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 2, md: 6 }} sx={{ mb: { xs: 3, md: 5 } }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography id="canada-title" component="h2" variant="h4" sx={{ fontWeight: 700, textWrap: 'balance' }}>
              {t.home.canadaTitle}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.7, maxWidth: MEASURE }}>
              {t.home.canadaText}
            </Typography>
            <Link href="https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/" target="_blank" rel="noopener noreferrer" underline="hover"
              sx={{ display: 'inline-block', mt: 1.5 }}>
              {t.home.canadaLink} <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>{t.common.newTab}</Box>→
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
          {t.home.canadaCredit}
        </Typography>
      </Container>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ (objections) + appel final                                       */
/* ------------------------------------------------------------------ */


export function FaqSection() {
  const t = useT();
  return (
    <Container maxWidth="md" component="section" aria-labelledby="faq-title" sx={{ py: { xs: 7, md: 10 } }}>
      <Typography id="faq-title" component="h2" variant="h4" sx={{ fontWeight: 700, mb: 3 }}>{t.home.faqTitle}</Typography>
      <Box>
        {t.home.faq.map(([q, a]) => (
          <Box key={q} component="details" sx={{ borderBottom: '1px solid', borderColor: 'divider',
            '&[open] .faq-chevron': { transform: 'rotate(180deg)' }, '& summary::-webkit-details-marker': { display: 'none' } }}>
            <Box component="summary" sx={{ listStyle: 'none', cursor: 'pointer', py: 2.25, display: 'flex', alignItems: 'center', gap: 2,
              fontWeight: 600, fontSize: '1.05rem', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: 1 } }}>
              <Box component="span" sx={{ mr: 'auto' }}>{q}</Box>
              <ExpandMoreRoundedIcon className="faq-chevron" aria-hidden="true" sx={{ color: 'text.secondary', transition: 'transform 200ms' }} />
            </Box>
            <Typography sx={{ pb: 2.5, color: 'text.secondary', lineHeight: 1.7, maxWidth: '68ch' }}>{a}</Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
}

export function FinalCta() {
  const t = useT();
  return (
    <Container maxWidth="lg" component="section" aria-labelledby="cta-title" sx={{ pb: { xs: 2, md: 4 } }}>
      <Box sx={{ borderRadius: 3, px: { xs: 3, md: 6 }, py: { xs: 5, md: 7 }, bgcolor: '#05070a', color: '#fff',
        backgroundImage: `radial-gradient(120% 140% at 100% 0%, rgba(251,191,36,0.16) 0%, rgba(5,7,10,0) 55%)` }}>
        <Typography id="cta-title" component="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: '22ch' }}>
          {t.home.ctaTitle}
        </Typography>
        <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.75)', maxWidth: '55ch' }}>
          {t.home.ctaText}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, mt: 3.5 }}>
          <Button component={NextLink} href="/dashboard" variant="contained" size="large" endIcon={<ChevronRightRoundedIcon />}>{t.common.exploreSites}</Button>
          <Button component={NextLink} href="/about" variant="outlined" size="large"
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}>
            {t.common.howItWorks}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
