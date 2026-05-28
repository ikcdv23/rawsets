import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, type LucideIcon, Trash2 } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

/**
 * ConfirmationModal — diálogo de confirmación reutilizable.
 *
 * Reúne piezas: usa el <Button> (no re-implementa botones) e iconos de
 * lucide-react-native (no dibuja SVG a mano).
 */

type Situation = 'success' | 'warning' | 'trash';

type ConfirmationModalProps = {
  visible: boolean; // si el modal se ve o no (lo controla la pantalla padre)
  situation?: Situation; // qué icono/color mostrar
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void; // función que ejecuta el padre al confirmar
  onCancel: () => void; // función que ejecuta el padre al cancelar / tocar fuera
};

// Cada "situación" decide: icono, color del icono, fondo del badge y qué
// variante usa el botón de confirmar. Datos, no condicionales sueltos.
// (Los colores van en hex porque lucide recibe el color como prop JS, no como clase.)
const tones: Record<
  Situation,
  { Icon: LucideIcon; iconColor: string; badge: string; confirm: 'primary' | 'destructive' }
> = {
  success: { Icon: Check, iconColor: '#0A0A0A', badge: 'bg-primary', confirm: 'primary' },
  warning: {
    Icon: AlertTriangle,
    iconColor: '#FF3B5C',
    badge: 'bg-destructive/15',
    confirm: 'destructive',
  },
  trash: { Icon: Trash2, iconColor: '#FF3B5C', badge: 'bg-destructive/15', confirm: 'destructive' },
};

export function ConfirmationModal({
  visible,
  situation = 'warning',
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const tone = tones[situation];
  const Icon = tone.Icon;

  return (
    // Modal nativo de RN: se superpone a todo. transparent = se ve el fondo.
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* Backdrop: capa oscura a pantalla completa. Tocarla = cancelar. */}
      <Pressable onPress={onCancel} className="flex-1 items-center justify-center bg-black/60 px-7">
        {/* La tarjeta. onPress vacío "absorbe" el toque para que NO llegue al
            backdrop (si no, tocar dentro de la tarjeta la cerraría). */}
        <Pressable
          onPress={() => {}}
          className="w-full rounded-3xl border border-border-strong bg-surface p-6"
        >
          {/* Badge circular con el icono de lucide */}
          <View
            className={`mb-5 h-[76px] w-[76px] items-center justify-center self-center rounded-full ${tone.badge}`}
          >
            <Icon color={tone.iconColor} size={34} strokeWidth={2.4} />
          </View>

          <Text className="text-center font-sans-bold text-2xl tracking-tight text-foreground">
            {title}
          </Text>
          <Text className="mt-2.5 text-center font-sans text-[13px] leading-5 text-muted">
            {message}
          </Text>

          {/* Botones en fila: escape a la izquierda, acción a la derecha.
              flex-1 en cada uno = se reparten el ancho a partes iguales. */}
          <View className="mt-6 flex-row gap-2.5">
            <Button variant="secondary" className="flex-1" onPress={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={tone.confirm} className="flex-1" onPress={onConfirm}>
              {confirmLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
