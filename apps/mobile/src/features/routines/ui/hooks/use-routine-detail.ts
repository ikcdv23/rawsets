import { useRepos } from "@/db/repo-provider";
import type { Exercise } from "@/features/exercises/domain/exercise";
import { listExercises } from "@/features/exercises/use-cases/list-exercises";
import type {
	Routine,
	RoutineExercise,
} from "@/features/routines/domain/routine";
import { addExercisesToRoutine } from "@/features/routines/use-cases/add-exercises-to-routine";
import { deleteRoutine } from "@/features/routines/use-cases/delete-routine";
import { moveExerciseInRoutine } from "@/features/routines/use-cases/move-exercise";
import { removeExerciseFromRoutine } from "@/features/routines/use-cases/remove-exercise-from-routine";
import { renameRoutine } from "@/features/routines/use-cases/rename-routine";
import { updateRoutineExercise } from "@/features/routines/use-cases/update-routine-exercise";
import {
	type StartWorkoutExercise,
	useWorkoutSession,
} from "@/features/workouts/ui/contexts/workout-session-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

const SECONDS_PER_SET_HEURISTIC = 180;

// Este hook encapsula toda la lógica de negocio y de estado para la pantalla de detalle de rutina.
// El componente se convierte en una vista "tonta" que simplemente renderiza lo que el hook le proporciona.
export function useRoutineDetail(id: string | undefined) {
	const router = useRouter();
	const { routine: routineRepo, exercise: exerciseRepo } = useRepos();
	const { startWorkout } = useWorkoutSession();

	// Estado de datos brutos
	const [routine, setRoutine] = useState<Routine | null>(null);
	const [catalog, setCatalog] = useState<Exercise[]>([]);
	const [loading, setLoading] = useState(true);

	// Estado de modos de la UI
	const [showPicker, setShowPicker] = useState(false);
	const [editing, setEditing] = useState<RoutineExercise | null>(null);
	const [showActions, setShowActions] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [showRename, setShowRename] = useState(false);
	const [reorderMode, setReorderMode] = useState(false);

	// --- CARGA DE DATOS ---
	const reload = useCallback(async () => {
		if (!id) return;
		try {
			const [rRes, catRes] = await Promise.all([
				routineRepo.findById(id),
				listExercises(exerciseRepo),
			]);
			if (rRes.ok) setRoutine(rRes.value);
			if (catRes.ok) setCatalog(catRes.value);

			if (!rRes.ok)
				console.error("[useRoutineDetail] findById error:", rRes.error);
			if (!catRes.ok)
				console.error("[useRoutineDetail] listExercises error:", catRes.error);
		} catch (err) {
			console.error("[useRoutineDetail] load error:", err);
		} finally {
			setLoading(false);
		}
	}, [id, routineRepo, exerciseRepo]);

	useFocusEffect(
		useCallback(() => {
			reload();
		}, [reload]),
	);

	// --- DATOS DERIVADOS (MEMOIZADOS) ---
	const catalogById = useMemo(
		() => new Map(catalog.map((e) => [e.id, e])),
		[catalog],
	);

	const muscleSummary = useMemo(() => {
		if (!routine) return "";
		const set = new Set<string>();
		for (const re of routine.exercises) {
			const ex = catalogById.get(re.exerciseId);
			if (!ex) continue;
			for (const mg of ex.muscleGroups) set.add(mg.group);
		}
		return Array.from(set)
			.slice(0, 3)
			.map((g) => g.charAt(0).toUpperCase() + g.slice(1))
			.join(" · ");
	}, [routine, catalogById]);

	const totalSets = useMemo(
		() => routine?.exercises.reduce((acc, re) => acc + re.targetSets, 0) ?? 0,
		[routine],
	);

	const estimatedMinutes = useMemo(
		() =>
			totalSets > 0
				? Math.round((totalSets * SECONDS_PER_SET_HEURISTIC) / 60)
				: null,
		[totalSets],
	);

	const editingExerciseName = useMemo(
		() => (editing ? catalogById.get(editing.exerciseId)?.name ?? "Ejercicio" : ""),
		[editing, catalogById],
	);

	// --- ACCIONES (ENVOLTORIOS DE CASOS DE USO) ---
	const handleStartWorkout = useCallback(async () => {
		if (!routine) return;

		const exercises = buildWorkoutExercises(routine, catalogById);
		try {
			await startWorkout({
				routineId: routine.id,
				routineName: routine.name,
				routineSubtitle: null,
				exercises,
			});
			router.push("/home");
		} catch (err) {
			console.error("[useRoutineDetail] startWorkout error:", err);
		}
	}, [routine, catalogById, startWorkout, router]);

	const handleRenameRoutine = useCallback(
		async (newName: string) => {
			if (!routine) return;
			const res = await renameRoutine(routineRepo, routine.id, newName);
			if (res.ok) {
				setShowRename(false);
				await reload();
			} else {
				console.error("[useRoutineDetail] renameRoutine error:", res.error);
			}
		},
		[routine, routineRepo, reload],
	);

	const handleDeleteRoutine = useCallback(async () => {
		if (!routine) return;
		setConfirmDelete(false);
		const res = await deleteRoutine(routineRepo, routine.id);
		if (res.ok) {
			router.back();
		} else {
			console.error("[useRoutineDetail] deleteRoutine error:", res.error);
		}
	}, [routine, routineRepo, router]);

	const handleAddExercises = useCallback(
		async (ids: string[]) => {
			if (!routine) return;
			const res = await addExercisesToRoutine(
				routineRepo,
				routine.id,
				ids.map((exerciseId) => ({ exerciseId })),
			);
			if (res.ok) {
				await reload();
				setShowPicker(false);
			} else {
				console.error("[useRoutineDetail] addExercises error:", res.error);
			}
		},
		[routine, routineRepo, reload],
	);

	const handleUpdateExercise = useCallback(
		async (patch: Partial<RoutineExercise>) => {
			if (!routine || !editing) return;
			const res = await updateRoutineExercise(
				routineRepo,
				routine.id,
				editing.exerciseId,
				patch,
			);
			if (res.ok) {
				await reload();
				setEditing(null);
			} else {
				console.error("[useRoutineDetail] updateExercise error:", res.error);
			}
		},
		[routine, editing, routineRepo, reload],
	);

	const handleRemoveExercise = useCallback(async () => {
		if (!routine || !editing) return;
		const res = await removeExerciseFromRoutine(
			routineRepo,
			routine.id,
			editing.exerciseId,
		);
		if (res.ok) {
			await reload();
			setEditing(null);
		} else {
			console.error("[useRoutineDetail] removeExercise error:", res.error);
		}
	}, [routine, editing, routineRepo, reload]);

	const handleMoveExercise = useCallback(
		async (exerciseId: string, direction: "up" | "down") => {
			if (!routine) return;
			const res = await moveExerciseInRoutine(
				routineRepo,
				routine.id,
				exerciseId,
				direction,
			);
			if (res.ok) {
				await reload();
			} else {
				console.error(`[useRoutineDetail] move ${direction} error:`, res.error);
			}
		},
		[routine, routineRepo, reload],
	);

	// --- VALOR DE RETORNO ---
	return {
		state: {
			routine,
			catalog,
			catalogById,
			loading,
			reorderMode,
			muscleSummary,
			totalSets,
			estimatedMinutes,
			editingExercise: editing,
			editingExerciseName,
		},
		ui: {
			isActionsSheetVisible: showActions,
			openActionsSheet: () => setShowActions(true),
			closeActionsSheet: () => setShowActions(false),
			isRenameModalVisible: showRename,
			openRenameModal: () => {
				setShowActions(false);
				setTimeout(() => setShowRename(true), 200);
			},
			closeRenameModal: () => setShowRename(false),
			isDeleteConfirmationVisible: confirmDelete,
			openDeleteConfirmation: () => {
				setShowActions(false);
				setTimeout(() => setConfirmDelete(true), 200);
			},
			closeDeleteConfirmation: () => setConfirmDelete(false),
			isPickerVisible: showPicker,
			openPicker: () => setShowPicker(true),
			closePicker: () => setShowPicker(false),
			isEditingModalVisible: !!editing,
			startEditingExercise: (re: RoutineExercise) => setEditing(re),
			stopEditingExercise: () => setEditing(null),
			toggleReorderMode: () => setReorderMode((v) => !v),
		},
		actions: {
			startWorkout: handleStartWorkout,
			renameRoutine: handleRenameRoutine,
			deleteRoutine: handleDeleteRoutine,
			addExercises: handleAddExercises,
			updateExercise: handleUpdateExercise,
			removeExercise: handleRemoveExercise,
			moveExercise: handleMoveExercise,
			goBack: () => router.back(),
		},
	};
}

function buildWorkoutExercises(
	routine: Routine,
	catalogById: Map<string, Exercise>,
): StartWorkoutExercise[] {
	return routine.exercises
		.sort((a, b) => a.position - b.position)
		.map((re): StartWorkoutExercise => {
			const ex = catalogById.get(re.exerciseId);
			const repsLabel =
				re.targetRepsMin === re.targetRepsMax
					? `${re.targetRepsMin}`
					: `${re.targetRepsMin}-${re.targetRepsMax}`;
			const primaryMuscle = ex?.muscleGroups[0]?.group ?? "general";
			return {
				id: re.exerciseId,
				name: ex?.name ?? "Ejercicio",
				muscleGroup: primaryMuscle.charAt(0).toUpperCase() + primaryMuscle.slice(1),
				targetSets: re.targetSets,
				targetReps: repsLabel,
			};
		});
}