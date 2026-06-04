import type { Routine } from '@/features/routines/domain/routine';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { addMonths, buildMonthGrid, isSameDay, monthName, startOfDay } from '../../domain/dates';
import type { ScheduledSession } from '../../domain/scheduled-session';
import { CalendarDayCell } from './calendar-day-cell';

// Resolución de color/letra a partir del nombre — replica `colorForName` de
// routine-card. Lo duplico aquí (10 líneas) en vez de subir un módulo
// compartido por ahora. Si en el futuro aparece un tercer consumidor, fuera.
const ROUTINE_COLORS = {
  lime: '#A8E055',
  amber: '#F5C24E',
  teal: '#5DD6C8',
} as const;

function colorForName(name: string): string {
  const ch = name.trim().slice(0, 1).toUpperCase();
  if (ch === 'E') return ROUTINE_COLORS.amber;
  if (ch === 'P') return ROUTINE_COLORS.teal;
  return ROUTINE_COLORS.lime;
}

function initialOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '·';
}

// Calendario mensual completo.
//
// Cuadrícula 7×6 (42 días). Incluye días del mes anterior/siguiente
// "fantasma" para llenar la grid. Solo los del mes actual son tappables.
//
// Tap en día → onDayPress(date). El parent decide qué hacer (abrir sheet,
// etc.) — la card NO sabe nada de rutinas u operaciones de scheduling.
export type CalendarMonthCardProps = {
  monthAnchor: Date;
  scheduled: ScheduledSession[];
  routines: Routine[]; // necesarias para resolver letra+color por routineId
  onMonthChange: (newAnchor: Date) => void;
  onDayPress: (date: Date) => void;
};

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function CalendarMonthCard({
  monthAnchor,
  scheduled,
  routines,
  onMonthChange,
  onDayPress,
}: CalendarMonthCardProps) {
  // Mapas para lookup rápido por timestamp_ms del día y por id de rutina.
  const sessionsByDayTs = useMemo(() => {
    const m = new Map<number, ScheduledSession>();
    for (const s of scheduled) m.set(startOfDay(s.date).getTime(), s);
    return m;
  }, [scheduled]);

  const routinesById = useMemo(() => {
    const m = new Map<string, Routine>();
    for (const r of routines) m.set(r.id, r);
    return m;
  }, [routines]);

  const today = startOfDay(new Date());
  const grid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const currentMonth = monthAnchor.getMonth();
  const monthLabel = `${monthName(monthAnchor).charAt(0).toUpperCase()}${monthName(monthAnchor).slice(1)}`;

  return (
    <View
      className="overflow-hidden rounded-[20px] border border-border p-4"
      style={{ backgroundColor: '#141414' }}
    >
      {/* Header: mes + flechas */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-baseline">
          <Text className="font-sans-black text-[19px] tracking-[-0.3px] text-foreground">
            {monthLabel}
          </Text>
          <Text className="ml-1.5 font-sans-bold text-[16px] text-muted">
            {monthAnchor.getFullYear()}
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          <Pressable
            onPress={() => onMonthChange(addMonths(monthAnchor, -1))}
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
            hitSlop={6}
            className="h-8 w-8 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
          >
            <ChevronLeft color="#8A8A8A" size={16} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            onPress={() => onMonthChange(addMonths(monthAnchor, 1))}
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
            hitSlop={6}
            className="h-8 w-8 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
          >
            <ChevronRight color="#8A8A8A" size={16} strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>

      {/* Cabecera L M X J V S D */}
      <View className="flex-row">
        {WEEKDAYS.map((wd, idx) => (
          <View key={wd} className="flex-1 items-center py-1">
            <Text
              className={[
                'font-sans-black text-[9px] uppercase tracking-[1.4px]',
                idx >= 5 ? 'text-muted-dim' : 'text-muted',
              ].join(' ')}
            >
              {wd}
            </Text>
          </View>
        ))}
      </View>

      {/* Cuadrícula 6 semanas × 7 días */}
      <View>
        {[0, 1, 2, 3, 4, 5].map((week) => (
          <View key={week} className="flex-row">
            {grid.slice(week * 7, (week + 1) * 7).map((d) => {
              const dayTs = startOfDay(d).getTime();
              const session = sessionsByDayTs.get(dayTs);
              const isOtherMonth = d.getMonth() !== currentMonth;
              const isToday = isSameDay(d, today);
              const routine = session?.routineId ? routinesById.get(session.routineId) : null;
              return (
                <View key={dayTs} className="flex-1 p-0.5">
                  <CalendarDayCell
                    day={d.getDate()}
                    letter={routine ? initialOf(routine.name) : null}
                    color={routine ? colorForName(routine.name) : null}
                    isOtherMonth={isOtherMonth}
                    isToday={isToday}
                    isRest={session?.routineId === null}
                    onPress={() => onDayPress(d)}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Leyenda: muestra rutinas que aparecen en este mes con su color */}
      <CalendarLegend scheduled={scheduled} routines={routines} monthAnchor={monthAnchor} />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function CalendarLegend({
  scheduled,
  routines,
  monthAnchor,
}: {
  scheduled: ScheduledSession[];
  routines: Routine[];
  monthAnchor: Date;
}) {
  // Solo rutinas que aparecen en el mes mostrado, deduplicadas.
  const items = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ id: string; name: string; color: string }> = [];
    for (const s of scheduled) {
      if (s.date.getMonth() !== monthAnchor.getMonth()) continue;
      if (!s.routineId || seen.has(s.routineId)) continue;
      const r = routines.find((x) => x.id === s.routineId);
      if (!r) continue;
      seen.add(s.routineId);
      list.push({ id: r.id, name: r.name, color: colorForName(r.name) });
    }
    return list;
  }, [scheduled, routines, monthAnchor]);

  if (items.length === 0) return null;

  return (
    <View className="mt-2 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border pt-2">
      {items.map((it) => (
        <View key={it.id} className="flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: it.color }} />
          <Text className="font-sans-black text-[9px] uppercase tracking-[1.3px] text-muted">
            {it.name}
          </Text>
        </View>
      ))}
    </View>
  );
}
