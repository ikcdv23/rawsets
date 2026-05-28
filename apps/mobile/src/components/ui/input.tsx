import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';

/**
 * Input — campo de texto con label, error y toggle de password.
 *
 * Es la primera primitiva con ESTADO INTERNO:
 *   - foco (para pintar borde lima al estar activo)
 *   - showPassword (para alternar el ojo de mostrar/ocultar)
 *
 * Eso es lo que le diferencia de Card o Stat: estos solo renderizan props.
 * Input "recuerda" cosas entre renders → hooks de useState.
 *
 * El estado del valor (lo tecleado) NO vive aquí. Lo controla la pantalla
 * padre (value + onChangeText). Esto se llama "controlled input": cada vez
 * que tecleas, el padre se entera y decide qué hacer.
 */
type InputType = 'text' | 'email' | 'password';

type InputProps = Omit<TextInputProps, 'secureTextEntry' | 'keyboardType' | 'autoCapitalize'> & {
  label?: string;
  error?: string;
  type?: InputType;
  leftIcon?: LucideIcon;
};

export function Input({ label, error, type = 'text', leftIcon: LeftIcon, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';

  // Heurística por tipo: el email no autocapitaliza, las contraseñas se ocultan.
  const keyboardType = type === 'email' ? 'email-address' : 'default';
  const autoCapitalize = type === 'email' || type === 'password' ? 'none' : 'sentences';
  const secureTextEntry = isPassword && !showPassword;

  // Borde: error > foco > reposo. Orden importa: error gana siempre.
  const borderColor = error
    ? 'border-destructive'
    : focused
      ? 'border-primary'
      : 'border-border-strong';

  return (
    <View>
      {label ? (
        <Text className="mb-2 font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
          {label}
        </Text>
      ) : null}

      <View className={`flex-row items-center rounded-2xl border ${borderColor} bg-surface px-4`}>
        {LeftIcon ? (
          <View className="mr-2.5">
            <LeftIcon color="#8A8A8A" size={18} strokeWidth={2.2} />
          </View>
        ) : null}
        <TextInput
          className="flex-1 py-4 font-sans text-base text-foreground"
          placeholderTextColor="#4A4A4A"
          autoCorrect={type === 'text'}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />

        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            className="ml-2 active:opacity-60"
          >
            {showPassword ? (
              <EyeOff color="#8A8A8A" size={18} strokeWidth={2.2} />
            ) : (
              <Eye color="#8A8A8A" size={18} strokeWidth={2.2} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-1.5 font-sans text-[12px] text-destructive">{error}</Text>
      ) : null}
    </View>
  );
}
