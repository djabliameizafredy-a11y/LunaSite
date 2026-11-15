'use client';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import SettingsInputAntennaRoundedIcon from '@mui/icons-material/SettingsInputAntennaRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { SERIES } from '@/theme/theme';
import { useDashboard } from '@/components/dashboard/DashboardState';
import { useT } from '@/i18n';

const MEASURE = '68ch';
const ICONS = [
  { icon: <WbSunnyRoundedIcon />, color: SERIES.sun },
  { icon: <PublicRoundedIcon />, color: SERIES.earth },
  { icon: <BoltRoundedIcon />, color: SERIES.sun },
  { icon: <SettingsInputAntennaRoundedIcon />, color: SERIES.earth },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section" sx={{ mt: { xs: 5, md: 6 } }}>
      <Typography component="h2" variant="h5" sx={{ fontWeight: 600, mb: 1.5, textWrap: 'balance' }}>{title}</Typography>
      {children}
    </Box>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <Typography sx={{ color: 'text.secondary', maxWidth: MEASURE, lineHeight: 1.7, mb: 1.5 }}>{children}</Typography>;
}

/** À propos : ce qu'est LunaSite, à quoi il sert, comment l'utiliser, et ce qu'il ne prétend pas faire. */
export default function AboutPage() {
  const t = useT();
  const a = t.about;
  const { sites } = useDashboard();
  const total = sites.data?.length;
  const withRelief = sites.data?.filter((s) => s.terrain.horizonMask).length;

  return (
    <Grid container spacing={{ xs: 4, lg: 6 }}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Typography component="h1" variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em', textWrap: 'balance', maxWidth: '20ch', mt: 1 }}>
          {a.title}
        </Typography>
        <Typography sx={{ fontSize: '1.15rem', lineHeight: 1.6, maxWidth: MEASURE, mt: 2 }}>{a.lead}</Typography>

        <Section title={a.whyTitle}>
          <Prose>{a.why1}</Prose>
          <Prose>{a.why2}</Prose>
        </Section>

        <Section title={a.computesTitle}>
          <Stack component="ul" sx={{ listStyle: 'none', p: 0, m: 0, gap: 2.5, maxWidth: MEASURE }}>
            {a.computes.map(([title, text], i) => (
              <Stack component="li" key={title} direction="row" sx={{ gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ color: ICONS[i].color, display: 'flex', pt: 0.25 }} aria-hidden="true">{ICONS[i].icon}</Box>
                <Box>
                  <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>{text}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Section>

        <Section title={a.useTitle}>
          <Box component="ol" sx={{ p: 0, m: 0, listStyle: 'none', maxWidth: MEASURE }}>
            {a.steps.map(([title, text], i) => (
              <Stack component="li" key={title} direction="row" sx={{ gap: 2, pb: i === a.steps.length - 1 ? 0 : 3 }}>
                <Box sx={{ flex: '0 0 auto', width: 28, height: 28, borderRadius: '50%', border: '1px solid', borderColor: 'divider',
                  display: 'grid', placeItems: 'center', fontSize: '0.8rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', bgcolor: 'background.paper' }}
                  aria-hidden="true">
                  {i + 1}
                </Box>
                <Box sx={{ pt: 0.25 }}>
                  <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>{text}</Typography>
                </Box>
              </Stack>
            ))}
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, mt: 3 }}>
            <Button component={NextLink} href="/dashboard" variant="contained" endIcon={<ChevronRightRoundedIcon />}>{a.openOverview}</Button>
            <Button component={NextLink} href="/horizon" variant="outlined">{t.nav.horizon}</Button>
            <Button component={NextLink} href="/sites" variant="outlined">{t.common.seeCatalogue}</Button>
          </Stack>
        </Section>

        <Section title={a.dataTitle}>
          <Prose>{a.data1}</Prose>
          <Prose>{a.data2}</Prose>
        </Section>

        <Section title={a.notTitle}>
          <Prose>{a.not}</Prose>
          <Link component={NextLink} href="/limits" underline="hover">{a.allLimits}</Link>
        </Section>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Card variant="outlined" sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
          <CardContent>
            <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>{a.brief}</Typography>
            <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 1.5,
              '& dt': { color: 'text.secondary', fontSize: '0.875rem' }, '& dd': { m: 0, fontSize: '0.875rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' } }}>
              <dt>{a.briefRows.sites}</dt><dd>{a.briefSites(total != null ? String(total) : '…')}</dd>
              <dt>{a.briefRows.relief}</dt><dd>{a.briefRelief(withRelief != null ? String(withRelief) : '…')}</dd>
              <dt>{a.briefRows.period}</dt><dd>{a.briefPeriod}</dd>
              <dt>{a.briefRows.validation}</dt><dd>JPL Horizons (NASA)</dd>
              <dt>{a.briefRows.frame}</dt><dd>{a.briefFrame}</dd>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{a.briefNote}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
