import { BookMarked, Home, type LucideIcon, PersonStanding, Settings } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

/**
 * TabBar — píldora flotante de navegación.
 *
 * El tab activo CRECE con un muelle (como el mockup). Animamos `flexGrow`
 * directamente (no `layout`): así reflowea el layout de verdad y los iconos
 * NO se estiran — el bug del scale que tenía la versión con LinearTransition.
 *
 * Recibe `state` y `navigation` de expo-router (callback `tabBar`).
 */
type TabBarRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabBarRoute[] };
  navigation: { navigate: (name: string) => void };
};

// OJO: expo-router nombra las rutas por la RUTA del archivo, no por la carpeta.
// `app/(workspace)/home/index.tsx` → la ruta se llama "home/index" (no "home").
// Las sub-pantallas (settings/profile/index, routines/[id]) NO son tabs → se ignoran.
const TABS: Record<string, { Icon: LucideIcon; label: string }> = {
  'home/index': { Icon: Home, label: 'Home' },
  'routines/index': { Icon: BookMarked, label: 'Rutinas' },
  'body/index': { Icon: PersonStanding, label: 'Body' },
  'settings/index': { Icon: Settings, label: 'Ajustes' },
};

// lucide recibe el color como prop JS (no como clase), por eso van en hex.
const ICON_ACTIVE = '#0A0A0A'; // sobre fondo lima
const ICON_INACTIVE = '#8A8A8A'; // muted

// Muelle: rebote suave con overshoot, como el cubic-bezier del mockup.
const GROW_SPRING = { damping: 14, stiffness: 170, mass: 0.9 };

// Un tab. Es su propio componente porque usa hooks (useSharedValue, etc.),
// y los hooks no pueden ir dentro de un .map.
function Tab({
  tab,
  isActive,
  onPress,
}: {
  tab: { Icon: LucideIcon; label: string };
  isActive: boolean;
  onPress: () => void;
}) {
  // flexGrow animado: 2 cuando activo, 1 cuando no.
  const grow = useSharedValue(isActive ? 2 : 1);

  useEffect(() => {
    grow.value = withSpring(isActive ? 2 : 1, GROW_SPRING);
  }, [isActive, grow]);

  // Estilo animado: en cada frame aplica el flexGrow actual del muelle.
  const animatedStyle = useAnimatedStyle(() => ({ flexGrow: grow.value }));

  const Icon = tab.Icon;

  return (
    <Animated.View style={[{ flexBasis: 0 }, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={isActive ? { selected: true } : {}}
        accessibilityLabel={tab.label}
        onPress={onPress}
        // Visuales con className (Pressable normal → NativeWind sí aplica).
        className={[
          'h-[52px] flex-row items-center justify-center gap-2 rounded-full active:opacity-80',
          isActive ? 'bg-primary' : '',
        ].join(' ')}
      >
        <Icon
          color={isActive ? ICON_ACTIVE : ICON_INACTIVE}
          size={20}
          strokeWidth={isActive ? 2.6 : 2.2}
        />
        {isActive ? (
          <Text className="font-sans-bold text-[11px] uppercase tracking-[1px] text-background">
            {tab.label}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function TabBar({ state, navigation }: TabBarProps) {
  return (
    <View
      className="absolute bottom-6 left-[18px] right-[18px] h-16 flex-row items-center gap-1 rounded-full border border-border-strong bg-surface/95 px-1.5"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
      }}
    >
      {state.routes.map((route, idx) => {
        const tab = TABS[route.name];
        if (!tab) return null; // sub-pantallas (perfil, detalle) no se pintan

        const isActive = state.index === idx;
        return (
          <Tab
            key={route.key}
            tab={tab}
            isActive={isActive}
            onPress={() => {
              if (!isActive) navigation.navigate(route.name);
            }}
          />
        );
      })}
    </View>
  );
}
