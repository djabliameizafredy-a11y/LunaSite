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

const MEASURE = '68ch';

const QUESTIONS = [
  { icon: <WbSunnyRoundedIcon />, color: SERIES.sun, title: 'Position du Soleil',
    text: "Élévation et azimut du Soleil vus depuis le site, heure par heure. On en tire la part du temps éclairé et la plus longue nuit." },
  { icon: <PublicRoundedIcon />, color: SERIES.earth, title: 'Position de la Terre',
    text: "Hauteur de la Terre au-dessus de l'horizon du site dans le temps, pas seulement « visible ou non »." },
  { icon: <BoltRoundedIcon />, color: SERIES.sun, title: "Potentiel d'énergie",
    text: "Énergie d'un panneau solaire illustratif sur la période. Les hypothèses (surface, rendement) sont affichées à côté du chiffre." },
  { icon: <SettingsInputAntennaRoundedIcon />, color: SERIES.earth, title: 'Communication directe',
    text: "Les fenêtres où la Terre est au-dessus de l'horizon : une liaison directe est géométriquement possible, pas garantie." },
];

const STEPS = [
  { title: 'Choisissez un site', text: "Avec le sélecteur en haut du menu, ou en cliquant sur un point de la carte du pôle Sud." },
  { title: 'Réglez la période', text: "Jour de début et durée, en haut de la page : de 1 jour à 29 jours (environ un jour lunaire complet)." },
  { title: "Lisez la vue d'ensemble", text: "Les quatre résultats en haut, puis les courbes du Soleil et de la Terre, et la frise des fenêtres d'éclairage et de communication." },
  { title: 'Comparez', text: "Le catalogue liste tous les sites avec leur pente, leur relief local et le statut de leurs coordonnées. Un clic ouvre le site." },
  { title: "Vérifiez d'où vient chaque chiffre", text: "Chaque carte indique son niveau de calcul : relief LOLA, horizon plat ou démo. La page « Données et limites » détaille les sources." },
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
  const { sites } = useDashboard();
  const total = sites.data?.length;
  const withRelief = sites.data?.filter((s) => s.terrain.horizonMask).length;

  return (
    <Grid container spacing={{ xs: 4, lg: 6 }}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Typography component="h1" variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em', textWrap: 'balance', maxWidth: '20ch', mt: 1 }}>
          Où se poser au pôle Sud de la Lune, et quand ?
        </Typography>
        <Typography sx={{ fontSize: '1.15rem', lineHeight: 1.6, maxWidth: MEASURE, mt: 2 }}>
          LunaSite compare des sites d'atterrissage candidats du pôle Sud lunaire et des dates de mission. Pour chaque
          site et chaque période, il montre où se trouvent le Soleil et la Terre par rapport à l'horizon réel du site,
          et ce que cela implique pour l'énergie et les communications.
        </Typography>

        <Section title="Pourquoi le pôle Sud est difficile">
          <Prose>
            Au pôle Sud, le Soleil et la Terre restent très bas sur l'horizon, à quelques degrés seulement. Une crête de
            quelques centaines de mètres suffit à les masquer pendant des heures, voire des jours. Deux sites distants de
            quelques kilomètres peuvent donc avoir un éclairage et des fenêtres de communication très différents.
          </Prose>
          <Prose>
            Les outils existants (QuickMap, Moon Trek) sont puissants mais généralistes. LunaSite répond à une seule
            question, celle des équipes de mission CLPS : quel site, à quelle date, pour quelle énergie et quelle liaison
            avec la Terre ?
          </Prose>
        </Section>

        <Section title="Ce que LunaSite calcule">
          <Stack component="ul" sx={{ listStyle: 'none', p: 0, m: 0, gap: 2.5, maxWidth: MEASURE }}>
            {QUESTIONS.map((q) => (
              <Stack component="li" key={q.title} direction="row" sx={{ gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ color: q.color, display: 'flex', pt: 0.25 }} aria-hidden="true">{q.icon}</Box>
                <Box>
                  <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>{q.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>{q.text}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Section>

        <Section title="Comment l'utiliser">
          <Box component="ol" sx={{ p: 0, m: 0, listStyle: 'none', counterReset: 'step', maxWidth: MEASURE }}>
            {STEPS.map((s, i) => (
              <Stack component="li" key={s.title} direction="row" sx={{ gap: 2, pb: i === STEPS.length - 1 ? 0 : 3, position: 'relative' }}>
                <Box sx={{ flex: '0 0 auto', width: 28, height: 28, borderRadius: '50%', border: '1px solid', borderColor: 'divider',
                  display: 'grid', placeItems: 'center', fontSize: '0.8rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', bgcolor: 'background.paper' }}
                  aria-hidden="true">
                  {i + 1}
                </Box>
                <Box sx={{ pt: 0.25 }}>
                  <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>{s.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>{s.text}</Typography>
                </Box>
              </Stack>
            ))}
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, mt: 3 }}>
            <Button component={NextLink} href="/dashboard" variant="contained" endIcon={<ChevronRightRoundedIcon />}>Ouvrir la vue d'ensemble</Button>
            <Button component={NextLink} href="/sites" variant="outlined">Voir le catalogue</Button>
          </Stack>
        </Section>

        <Section title="D'où viennent les chiffres">
          <Prose>
            Le relief vient du modèle numérique de terrain <b>LOLA</b> (Lunar Reconnaissance Orbiter, NASA PDS), à 80 m par
            pixel : il donne les pentes et, pour chaque site, un profil d'horizon sur 360°. Les positions du Soleil et de la
            Terre sont calculées par le moteur d'éphémérides <i>astronomy-engine</i>, puis comparées aux éphémérides
            officielles <b>JPL Horizons</b> de la NASA : l'écart reste de l'ordre du millième de degré sur les sites polaires.
          </Prose>
          <Prose>
            Le catalogue des sites et le relief sont stockés dans une base PostgreSQL. L'indicateur « Source des données »,
            en bas du menu, dit toujours si l'application lit la base ou son catalogue embarqué.
          </Prose>
        </Section>

        <Section title="Ce que LunaSite n'est pas">
          <Prose>
            Un outil pédagogique et d'aide à la comparaison, pas une recommandation opérationnelle d'atterrissage. La
            visibilité de la Terre est géométrique : elle ne tient compte ni des antennes ni du réseau au sol. L'énergie est
            indicative et dépend d'hypothèses affichées. Les sites sans relief chargé sont signalés « horizon plat » : leurs
            résultats peuvent être surestimés.
          </Prose>
          <Link component={NextLink} href="/limits" underline="hover">Toutes les sources et limites →</Link>
        </Section>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Card variant="outlined" sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
          <CardContent>
            <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>En bref</Typography>
            <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 1.5,
              '& dt': { color: 'text.secondary', fontSize: '0.875rem' }, '& dd': { m: 0, fontSize: '0.875rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' } }}>
              <dt>Sites</dt><dd>{total ?? '…'} candidats</dd>
              <dt>Relief LOLA</dt><dd>{withRelief ?? '…'} sites avec horizon réel</dd>
              <dt>Période</dt><dd>1 à 29 jours</dd>
              <dt>Validation</dt><dd>JPL Horizons (NASA)</dd>
              <dt>Cadre</dt><dd>NASA Space Apps 2026, défi CLPS</dd>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              Les chiffres affichés sont recalculés à chaque changement de site ou de période, à partir des mêmes données
              que l'API.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
