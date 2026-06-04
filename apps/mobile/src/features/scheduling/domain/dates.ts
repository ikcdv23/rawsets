// Utilidades de fecha PURAS. Sin dependencias externas (no date-fns, no luxon)
// para mantener el bundle ligero. Todas las funciones trabajan con Date local.
//
// Justificación local-time: el calendario refleja "días" que el usuario percibe
// en su zona horaria. Almacenar UTC midnight introduce off-by-one a las 23:00
// de la noche y similares. Local midnight es lo que la gente espera de "lunes".

// Comienzo del día LOCAL para un Date dado. Útil para normalizar fechas que
// vengan con horas/minutos a un "canonical day key" comparable.
export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

// Comienzo del MES local para un Date dado.
export function startOfMonth(d: Date): Date {
  const r = startOfDay(d);
  r.setDate(1);
  return r;
}

// ¿Mismo día calendario? Independiente de la hora.
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

// Día de la semana con LUNES como 0 (no Sunday como JS por defecto).
// Útil para alinear cuadrículas L-M-X-J-V-S-D del mockup.
export function mondayIndex(d: Date): number {
  // getDay(): 0=Sun..6=Sat → recomputar a 0=Mon..6=Sun.
  return (d.getDay() + 6) % 7;
}

// Genera las 6 semanas (42 celdas) que se muestran en el grid mensual.
// Empieza en el lunes anterior o igual al primer día del mes. Permite que
// días del mes anterior y siguiente aparezcan grisáceos en sus filas.
export function buildMonthGrid(monthAnchor: Date): Date[] {
  const first = startOfMonth(monthAnchor);
  const offset = mondayIndex(first);
  const gridStart = addDays(first, -offset);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(addDays(gridStart, i));
  }
  return cells;
}

// Etiqueta legible "mayo 2026" sin librerías — minúsculas a propósito para
// uso en headers ("Mayo 2026" se capitaliza en el componente).
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
export function monthName(d: Date): string {
  return MONTH_NAMES[d.getMonth()] ?? '';
}

// Día y mes legibles "28 de mayo" para el header del sheet de asignar.
export function longDayLabel(d: Date): string {
  const day = d.getDate();
  const month = monthName(d);
  return `${day} de ${month}`;
}

const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export function weekdayName(d: Date): string {
  return WEEKDAY_NAMES[mondayIndex(d)] ?? '';
}
