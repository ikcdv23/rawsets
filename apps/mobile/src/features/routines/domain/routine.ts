// Composición de un ejercicio dentro de una rutina. Carga lo planificado, no
// lo ejecutado — la ejecución vive en `sets` durante un workout. Ver ADR-0004.
export type RoutineExercise = {
  exerciseId: string;
  position: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetWeight: number | null;
  notes: string | null;
};

// Una rutina es una SESIÓN nombrada (no un programa multi-día).
// Para hacer un programa de varios días, el usuario monta varias rutinas
// y las coloca en el calendario (`scheduled_sessions`). Ver ADR-0004 §1.
export type Routine = {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: Date;
};
