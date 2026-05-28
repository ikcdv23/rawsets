import Svg, { Path } from 'react-native-svg';

/**
 * GoogleIcon — la "G" de Google en monocromo.
 *
 * Lucide no tiene marcas de Google; este SVG está extraído del mockup auth.html.
 * Pintado en color (text-foreground por defecto) para mantener la estética dark.
 */
type GoogleIconProps = {
  color?: string;
  size?: number;
};

export function GoogleIcon({ color = '#FAFAFA', size = 18 }: GoogleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.3-1 2.4-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5z"
      />
      <Path
        fill={color}
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.6c-.9.6-2 1-3.3 1-2.5 0-4.7-1.7-5.4-4H3.2v2.6C4.9 19.9 8.2 22 12 22z"
      />
      <Path
        fill={color}
        d="M6.6 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.2C2.4 8.8 2 10.4 2 12s.4 3.2 1.2 4.6L6.6 14z"
      />
      <Path
        fill={color}
        d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.9 14.7 2 12 2 8.2 2 4.9 4.1 3.2 7.4L6.6 10c.7-2.3 2.9-4 5.4-4z"
      />
    </Svg>
  );
}
