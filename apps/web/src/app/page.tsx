'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { preload } from 'react-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import SettingsInputAntennaRoundedIcon from '@mui/icons-material/SettingsInputAntennaRounded';
import ColorModeIconDropdown from '@/shared-theme/ColorModeIconDropdown';
import { CustomIcon } from '@/components/dashboard/AppNavbar';
import { SERIES } from '@/theme/theme';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { CanadaSection, FaqSection, FinalCta, MoonSection, TrustSection } from '@/components/landing/LandingSections';
import { SearchCommand } from '@/components/dashboard/SearchCommand';
import { FadeIn, HorizonLine, RiseLine } from '@/components/motion/motion';
import { useT } from '@/i18n';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';

const Q_STYLE = [
  { icon: <WbSunnyRoundedIcon />, color: SERIES.sun },
  { icon: <PublicRoundedIcon />, color: SERIES.earth },
  { icon: <BoltRoundedIcon />, color: SERIES.sun },
  { icon: <SettingsInputAntennaRoundedIcon />, color: SERIES.earth },
];

/** Accueil : hero vidéo (Lune et sites d'atterrissage), puis les 4 visualisations du défi. */
export default function Home() {
  const video = useRef<HTMLVideoElement>(null);
  const t = useT();
  // L'image de couverture est le candidat LCP de l'accueil : on la demande en priorité haute.
  preload('/hero/poster.jpg', { as: 'image', fetchPriority: 'high' });

  // Pas d'attribut autoplay : la lecture ne démarre qu'ici, et seulement sans « réduire les animations »
  // (sinon la vidéo bougerait un instant avant d'être mise en pause).
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => { if (!video.current) return; if (reduce.matches) video.current.pause(); else void video.current.play().catch(() => {}); };
    apply();
    reduce.addEventListener('change', apply);
    return () => reduce.removeEventListener('change', apply);
  }, []);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box component="section" sx={{ position: 'relative', minHeight: { xs: '92vh', md: '100vh' }, overflow: 'hidden', bgcolor: '#000', color: '#fff' }}>
        <Box
          component="video"
          ref={video}
          src="/hero/hero.mp4"
          poster="/hero/poster.jpg"
          width={640}
          height={360}
          preload="metadata"
          muted
          loop
          playsInline
          aria-hidden="true"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: { xs: '62% center', md: 'center' } }}
        />
        {/* Dégradé : lisibilité du texte à gauche, la Lune reste visible à droite ; adoucit aussi la basse résolution de la vidéo. */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute', inset: 0,
            background: {
              xs: 'linear-gradient(180deg, rgba(3,5,9,0.55) 0%, rgba(3,5,9,0.35) 45%, rgba(3,5,9,0.95) 100%)',
              md: 'linear-gradient(90deg, rgba(3,5,9,0.92) 0%, rgba(3,5,9,0.65) 38%, rgba(3,5,9,0.05) 70%), linear-gradient(0deg, rgba(3,5,9,0.9) 0%, rgba(3,5,9,0) 30%)',
            },
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" sx={{ alignItems: 'center', py: 2.5, gap: 1 }}>
            <CustomIcon color="#fff" size="2rem" />
            <Typography variant="h6" component="p" sx={{ fontWeight: 700, mr: 'auto' }}>LunaSite</Typography>
            <Box sx={{ color: '#fff' }}><SearchCommand compact /></Box>
            <LanguageSwitch onDark />
            <Button component={Link} href="/dashboard" size="small" sx={{ color: '#fff', display: { xs: 'none', sm: 'inline-flex' } }}>{t.nav.dashboard}</Button>
            <ColorModeIconDropdown />
          </Stack>

          <Stack sx={{ maxWidth: 760, pt: { xs: '18vh', md: '20vh' }, pb: 8, gap: 3 }}>
            <FadeIn sx={{ alignSelf: 'flex-start' }}><Chip label={t.home.badge} size="small" sx={{ alignSelf: 'flex-start', color: '#fff', borderColor: 'rgba(255,255,255,0.35)', bgcolor: 'rgba(255,255,255,0.08)' }} variant="outlined" /></FadeIn>
            <Typography component="h1" sx={{ fontSize: { xs: '2.4rem', md: '3.6rem' }, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
              <RiseLine delay={350}>{t.home.titleLine1}</RiseLine>
              <RiseLine delay={440}>{t.home.titleLine2}</RiseLine>
            </Typography>
            <HorizonLine color={SERIES.sun} delay={120} />
            <FadeIn delay={650}>
            <Typography sx={{ fontSize: { xs: '1rem', md: '1.15rem' }, color: 'rgba(255,255,255,0.8)', maxWidth: 520 }}>
              {t.home.subtitle}
            </Typography>
            </FadeIn>
            <FadeIn delay={720}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5 }}>
              <Button component={Link} href="/dashboard" variant="contained" size="large" endIcon={<ChevronRightRoundedIcon />}>
                {t.common.exploreSites}
              </Button>
              <Button component={Link} href="/sites" variant="outlined" size="large" startIcon={<TableRowsRoundedIcon />}
                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                {t.common.seeCatalogue}
              </Button>
            </Stack>
            </FadeIn>
            <FadeIn delay={800}>
            <Stack direction="row" sx={{ gap: 3, flexWrap: 'wrap', pt: 1 }}>
              {t.home.stats.map(([n, l]) => (
                <Box key={l}>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.1 }}>{n}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{l}</Typography>
                </Box>
              ))}
            </Stack>
            </FadeIn>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" component="section" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography component="h2" variant="h4" sx={{ mb: 1 }}>{t.home.questionsTitle}</Typography>
        <Typography sx={{ color: 'text.secondary', mb: 4, maxWidth: 640 }}>
          {t.home.questionsIntro}
        </Typography>
        <Grid container spacing={2}>
          {t.home.questions.map(([title, text], i) => (
            <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ color: Q_STYLE[i].color, mb: 1 }} aria-hidden="true">{Q_STYLE[i].icon}</Box>
                  <Typography component="h3" variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>{i + 1} · {title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{text}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 3 }}>{t.home.heroCredit}</Typography>
      </Container>
      <MoonSection />
      <TrustSection />
      <CanadaSection />
      <FaqSection />
      <FinalCta />
      <Container maxWidth="lg">
        <SiteFooter />
      </Container>
    </Box>
  );
}
