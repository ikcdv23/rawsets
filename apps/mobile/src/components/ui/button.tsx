import type { ReactNode } from 'react';
import { Pressable, type PressableProps, Text } from 'react-native';

/**
 * Button — primitivo del design system.
 *
 * Patrón clave: las VARIANTES son datos, no condicionales sueltos.
 * Cada variante/tamaño es una entrada en un objeto que mapea a clases
 * de NativeWind. Añadir una variante = añadir una línea, sin tocar el JSX.
 */

type ButtonVariant = 'primary' | 'secondary' | 'destructive';
type ButtonSize = 'md' | 'sm';

// Omit 'children'/'style': children lo tipamos nosotros (es la etiqueta),
// y el estilo lo controla la variante, no quien usa el botón.
type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  // Permite a quien lo usa ajustar SOLO el layout (ej. 'flex-1' en una fila),
  // sin tocar las clases de variante/tamaño que controla el componente.
  className?: string;
} & Omit<PressableProps, 'children' | 'style'>;

// Contenedor por variante. Objeto plano en vez de una librería de variantes
// (cva / tailwind-variants): cero dependencias y se lee de un vistazo.
const container: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface-2 border border-border', // el ex-"ghost", ahora sólido
  destructive: 'bg-destructive',
};

// El color del TEXTO cambia con la variante: tiene que contrastar con su fondo.
const label: Record<ButtonVariant, string> = {
  primary: 'text-background', // texto casi negro sobre lima
  secondary: 'text-foreground', // texto claro sobre gris
  destructive: 'text-white', // blanco sobre rose
};

const sizeBox: Record<ButtonSize, string> = {
  md: 'h-14 px-5 rounded-2xl', // 56px — el de CTAs y modales
  sm: 'h-11 px-4 rounded-xl', // 44px
};

const sizeText: Record<ButtonSize, string> = {
  md: 'text-[15px]',
  sm: 'text-[13px]',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    // Pressable (no TouchableOpacity): es el componente táctil moderno de RN,
    // expone el estado `pressed` y NativeWind mapea ese estado a la variante `active:`.
    <Pressable
      disabled={disabled}
      // Composición: clases base + tamaño + variante + estado disabled + layout extra.
      // active:opacity-90 da el feedback de "click" (en los mockups era scale 0.98).
      className={[
        'flex-row items-center justify-center gap-2 active:opacity-90',
        sizeBox[size],
        container[variant],
        disabled ? 'opacity-50' : '',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {/* En RN TODO texto va dentro de <Text>. Aquí envolvemos la etiqueta
          y le aplicamos peso/color. Sentence case lo decide quien lo usa
          (no forzamos uppercase, fue decisión de diseño). */}
      <Text className={['font-sans-bold tracking-tight', sizeText[size], label[variant]].join(' ')}>
        {children}
      </Text>
    </Pressable>
  );
}
