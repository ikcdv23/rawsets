import type { Equipment } from '../domain/equipment';
import type { Exercise, MuscleGroupContribution } from '../domain/exercise';
import type { ExerciseRepo } from '../ports/exercise-repo';

export type CreateCustomExerciseInput = {
  name: string;
  equipment: Equipment;
  isBodyweight: boolean;
  muscleGroups: MuscleGroupContribution[];
};

// Crea un ejercicio custom del usuario. `isCustom` se fuerza a true (no se
// negocia). `id` lo genera el caller (typically uuid v7) para mantener este
// use-case puro y testeable sin mockear uuid.
export async function createCustomExercise(
  repo: ExerciseRepo,
  input: CreateCustomExerciseInput,
  idGenerator: () => string,
): Promise<string> {
  if (input.name.trim().length === 0) {
    throw new Error('El nombre del ejercicio no puede estar vacío.');
  }
  if (input.muscleGroups.length === 0) {
    throw new Error('Un ejercicio debe contribuir al menos a un grupo muscular.');
  }
  for (const mg of input.muscleGroups) {
    if (mg.weight <= 0) {
      throw new Error(`Contribución a ${mg.group} debe ser > 0.`);
    }
  }

  const id = idGenerator();
  const exercise: Omit<Exercise, 'createdAt'> = {
    id,
    name: input.name.trim(),
    equipment: input.equipment,
    isBodyweight: input.isBodyweight,
    isCustom: true,
    muscleGroups: input.muscleGroups,
  };
  await repo.create(exercise);
  return id;
}
