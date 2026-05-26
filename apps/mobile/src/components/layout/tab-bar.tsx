import { BarChart3, BookMarked, Home, type LucideIcon, Plus, Settings } from 'lucide-react-native';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Tipo mínimo de las props que nos da expo-router como `tabBar` callback.
// No importamos `BottomTabBarProps` directamente porque expo-router empaqueta
// una versión interna de react-navigation/bottom-tabs y los tipos del paquete
// público no son compatibles. Definimos lo que realmente usamos.
type TabBarRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabBarRoute[] };
  navigation: { navigate: (name: string) => void };
};

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  routines: BookMarked,
  stats: BarChart3,
  settings: Settings,
};

// Constantes visuales del dock + notch.
const DOCK_HEIGHT = 72;
const NOTCH_RADIUS = 38;
const NOTCH_DEPTH = 26;
const FAB_SIZE = 60;
// Color literal porque SVG fill no soporta clases NativeWind directas.
// Mantener sincronizado con --color-primary en global.css.
const VIOLET = 'rgb(107, 33, 207)';

/** Genera el path SVG del dock con el notch cóncavo centrado. */
function buildDockPath(width: number): string {
  const cx = width / 2;
  const r = NOTCH_RADIUS;
  const d = NOTCH_DEPTH;

  // Path: rectángulo del dock con un dip cóncavo arriba en el centro.
  // Los cubic Beziers crean la transición suave entre el borde recto y la curva del notch.
  return [
    'M 0 0',
    `L ${cx - r - 14} 0`,
    `C ${cx - r - 2} 0, ${cx - r + 4} ${d}, ${cx} ${d}`,
    `C ${cx + r - 4} ${d}, ${cx + r + 2} 0, ${cx + r + 14} 0`,
    `L ${width} 0`,
    `L ${width} ${DOCK_HEIGHT}`,
    `L 0 ${DOCK_HEIGHT}`,
    'Z',
  ].join(' ');
}

export function TabBar({ state, navigation }: TabBarProps) {
  const { width } = useWindowDimensions();

  // Split icons 2 + 2 alrededor del FAB.
  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2, 4);

  return (
    <View
      className="absolute bottom-0 left-0 right-0"
      style={{ height: DOCK_HEIGHT + FAB_SIZE / 2 }}
      pointerEvents="box-none"
    >
      {/* Fondo SVG con el notch cóncavo */}
      <Svg width={width} height={DOCK_HEIGHT} style={{ position: 'absolute', bottom: 0 }}>
        <Path d={buildDockPath(width)} fill={VIOLET} />
      </Svg>

      {/* Iconos: 2 izquierda + 2 derecha. Mismo offset desde el centro. */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center"
        style={{ height: DOCK_HEIGHT }}
      >
        <View className="flex-1 flex-row items-center justify-around">
          {leftRoutes.map((route, idx) => (
            <TabIcon
              key={route.key}
              route={route}
              isActive={state.index === idx}
              onPress={() => navigation.navigate(route.name)}
            />
          ))}
        </View>
        <View style={{ width: NOTCH_RADIUS * 2 + 28 }} />
        <View className="flex-1 flex-row items-center justify-around">
          {rightRoutes.map((route, idx) => (
            <TabIcon
              key={route.key}
              route={route}
              isActive={state.index === idx + 2}
              onPress={() => navigation.navigate(route.name)}
            />
          ))}
        </View>
      </View>

      {/* FAB sobresaliendo encima del notch */}
      <View
        className="absolute left-1/2"
        style={{
          top: 0,
          marginLeft: -FAB_SIZE / 2,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Acción primaria"
          className="items-center justify-center rounded-full bg-primary-bright active:opacity-80"
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={() => {
            // TODO: acción primaria por decidir según pantalla.
          }}
        >
          <Plus color="#ffffff" size={28} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

function TabIcon({
  route,
  isActive,
  onPress,
}: {
  route: TabBarRoute;
  isActive: boolean;
  onPress: () => void;
}) {
  const Icon = ICONS[route.name];
  if (!Icon) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isActive ? { selected: true } : {}}
      accessibilityLabel={route.name}
      onPress={() => {
        if (!isActive) onPress();
      }}
      className="h-12 w-12 items-center justify-center"
    >
      <Icon color={isActive ? '#B8FA82' : '#ffffff'} size={24} strokeWidth={isActive ? 2.6 : 2} />
    </Pressable>
  );
}
