'use client';
import dayjs from 'dayjs';
import { useForkRef } from '@mui/material/utils';
import Button from '@mui/material/Button';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import { DatePicker, DatePickerFieldProps } from '@mui/x-date-pickers/DatePicker';
import { useParsedFormat, usePickerContext, useSplitFieldProps } from '@mui/x-date-pickers';
import { useDashboard } from './DashboardState';

// Repris de CustomDatePicker.tsx du template (bouton au lieu d'un champ), relié au jour de début UTC du dashboard.
interface ButtonFieldProps extends DatePickerFieldProps {}

function ButtonField(props: ButtonFieldProps) {
  const { forwardedProps } = useSplitFieldProps(props, 'date');
  // Ne pas transmettre au <button> les props internes du champ (corrige un avertissement présent aussi dans le template).
  const { slotProps: _sp, inputRef: _ir, slots: _sl, ...buttonProps } = forwardedProps as typeof forwardedProps & { slotProps?: unknown; inputRef?: unknown; slots?: unknown };
  const pickerContext = usePickerContext();
  const handleRef = useForkRef(pickerContext.triggerRef, pickerContext.rootRef);
  const parsedFormat = useParsedFormat();
  const valueStr = pickerContext.value == null ? parsedFormat : pickerContext.value.format(pickerContext.fieldFormat);

  return (
    <Button
      {...buttonProps}
      variant="outlined"
      ref={handleRef}
      size="small"
      startIcon={<CalendarTodayRoundedIcon fontSize="small" />}
      sx={{ minWidth: 'fit-content' }}
      onClick={() => pickerContext.setOpen((prev) => !prev)}
      aria-label="Jour de début (UTC)"
    >
      {pickerContext.label ?? valueStr}
    </Button>
  );
}

export default function CustomDatePicker() {
  const { date, setDate } = useDashboard();
  const value = dayjs(date);
  return (
    <DatePicker
      value={value}
      label={`Début ${value.format('DD MMM YYYY')} (UTC)`}
      onChange={(v) => v?.isValid() && setDate(v.format('YYYY-MM-DD'))}
      slots={{ field: ButtonField }}
      slotProps={{ nextIconButton: { size: 'small' }, previousIconButton: { size: 'small' } }}
      views={['day', 'month', 'year']}
    />
  );
}
