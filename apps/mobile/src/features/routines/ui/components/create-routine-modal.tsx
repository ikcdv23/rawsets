import { RoutineNameModal } from './routine-name-modal';

// Modal sencillo para crear una rutina — wrapper delgado sobre RoutineNameModal,
// que también sirve para renombrar. Aquí solo prefija los labels al uso "crear".
export type CreateRoutineModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
};

export function CreateRoutineModal({ visible, onClose, onCreate }: CreateRoutineModalProps) {
  return (
    <RoutineNameModal
      visible={visible}
      title="Nueva rutina"
      question="¿Cómo se llama?"
      confirmLabel="Crear"
      onClose={onClose}
      onConfirm={onCreate}
    />
  );
}
