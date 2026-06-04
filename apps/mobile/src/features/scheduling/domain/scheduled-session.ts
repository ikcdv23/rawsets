// Una sesión planificada en el calendario.
//
// `date` se guarda como timestamp_ms del COMIENZO DE DÍA EN LOCAL — ver
// `dates.ts` `startOfDay`. Esto da un valor estable para "este día" sin
// arrastrar la hora. La invariante "1 sesión por día" del ADR-0004 se sostiene
// porque `date` es UNIQUE en la tabla.
//
// `routineId = null` → descanso planificado (el usuario decidió no entrenar).
// Ausencia de fila para ese día → día neutral (no rompe la racha, no suma).
export type ScheduledSession = {
  id: string;
  date: Date;
  routineId: string | null;
  createdAt: Date;
};
