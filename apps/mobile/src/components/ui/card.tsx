import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

/**
 * Card — contenedor base (la "superficie" sobre el fondo).
 * Es solo una caja con fondo, borde y esquinas redondeadas.
 */
type CardProps = {
  children: ReactNode;
  className?: string; // layout extra opcional (ej. 'flex-1')
} & Omit<ViewProps, 'style'>;

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <View
      className={['rounded-3xl border border-border bg-surface p-5', className ?? ''].join(' ')}
      {...rest}
    >
      {children}
    </View>
  );
}
