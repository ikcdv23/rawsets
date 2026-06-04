import { Button } from '@/components/ui/button';
import type { Badge } from '@/features/achievements/domain/badge';
import { Lock } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

// Detail modal de un badge. Se abre al tappear una tarjeta del grid.
// Replica el bloque "detail" del mockup §profile (línea ~150 del HTML):
//   - Backdrop con blur
//   - Card centrada con medalla grande + nombre + descripción
//   - Si es locked: muestra contador de progreso y mensaje pendiente
//   - Si es unlocked/featured: muestra "Desbloqueado"
type BadgeDetailModalProps = {
  badge: Badge | null;
  onClose: () => void;
};

export function BadgeDetailModal({ badge, onClose }: BadgeDetailModalProps) {
  if (!badge) return null;

  const isLocked = badge.state === 'locked';
  const Icon = badge.icon;

  // Si es hidden y locked, NO revelamos el nombre ni la descripción real.
  // Mantenemos el suspense.
  const displayName = badge.hidden && isLocked ? 'Secreto' : badge.name;
  const displayDescription =
    badge.hidden && isLocked
      ? 'Sigue entrenando para descubrirlo. Algunos logros prefieren mantenerse en las sombras.'
      : badge.description;

  // Medalla grande con la misma lógica de la tile pero a doble tamaño.
  const medalBg = isLocked ? '#1A1A1A' : '#A8E055';
  const iconColor = isLocked ? '#4A4A4A' : '#0A0A0A';
  const ringColor = badge.state === 'featured' ? '#F5C24E' : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/60 px-7">
        {/* Card central. onPress vacío absorbe el toque para no cerrar al
            tocar dentro. */}
        <Pressable
          onPress={() => {}}
          className="w-full items-center rounded-3xl border border-border-strong bg-surface p-6"
        >
          {/* Medalla grande (96px) */}
          <View
            className="mb-5 h-[96px] w-[96px] items-center justify-center rounded-full"
            style={{
              backgroundColor: medalBg,
              ...(ringColor
                ? { borderWidth: 3, borderColor: ringColor }
                : isLocked
                  ? { borderWidth: 1, borderColor: '#2A2A2A' }
                  : {}),
            }}
          >
            <Icon color={iconColor} size={40} strokeWidth={2.4} />
          </View>

          {/* Pill superior con el estado */}
          {isLocked ? (
            <View className="mb-3 flex-row items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1">
              <Lock color="#8A8A8A" size={11} strokeWidth={2.6} />
              <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
                Bloqueado
              </Text>
            </View>
          ) : (
            <View className="mb-3 rounded-full bg-primary/15 px-3 py-1">
              <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-primary">
                {badge.state === 'featured' ? 'Logro destacado' : 'Desbloqueado'}
              </Text>
            </View>
          )}

          {/* Nombre */}
          <Text className="text-center font-sans-black text-[20px] leading-[24px] tracking-[-0.5px] text-foreground">
            {displayName}
          </Text>

          {/* Descripción */}
          <Text className="mt-2 text-center font-sans text-[13px] leading-[19px] text-muted">
            {displayDescription}
          </Text>

          {/* Progreso (solo locked con target) */}
          {isLocked && badge.progress ? (
            <View className="mt-5 w-full">
              <View className="mb-1.5 flex-row items-baseline justify-between">
                <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
                  Progreso
                </Text>
                <Text className="font-mono-bold text-[12px] tracking-[0.4px] text-foreground">
                  {badge.progress.current} / {badge.progress.target}
                  {badge.progress.suffix ? ` ${badge.progress.suffix}` : ''}
                </Text>
              </View>
              {/* Barra de progreso */}
              <View className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, (badge.progress.current / badge.progress.target) * 100)}%`,
                  }}
                />
              </View>
            </View>
          ) : null}

          {/* CTA cerrar */}
          <View className="mt-6 w-full">
            <Button variant="secondary" onPress={onClose}>
              Cerrar
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
