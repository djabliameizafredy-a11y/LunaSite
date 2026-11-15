'use client';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { lineClasses } from '@mui/x-charts/LineChart';

// Repris de StatCard.tsx du template : la pastille « tendance » devient le niveau de calcul du résultat.
export type StatCardProps = {
  title: string;
  value: string;
  interval: string;
  help: string;
  chip: { label: string; color: 'success' | 'warning' | 'error' | 'default' };
  data: number[];
  color: string;
};

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

export function StatCard({ title, value, interval, help, chip, data, color }: StatCardProps) {
  const gid = `area-gradient-${title.replace(/\W/g, '')}`;
  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
          <Typography component="h2" variant="subtitle2" gutterBottom>{title}</Typography>
          <Tooltip title={help} arrow><InfoOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary', mb: '0.35em' }} aria-label={help} /></Tooltip>
        </Stack>
        <Stack direction="column" sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1 }}>
          <Stack sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="p">{value}</Typography>
              <Chip size="small" color={chip.color} label={chip.label} />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{interval}</Typography>
          </Stack>
          <Box sx={{ width: '100%', height: 50 }}>
            <SparkLineChart
              color={color}
              data={data}
              area
              showHighlight
              showTooltip={false}
              sx={{ [`& .${lineClasses.area}`]: { fill: `url(#${gid})` } }}
            >
              <AreaGradient color={color} id={gid} />
            </SparkLineChart>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
