import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  icon?: ReactNode;
  className?: string;
}

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-brand py-3.5 rounded-xl items-center justify-center flex-row gap-2',
  secondary: 'bg-gray-100 py-3.5 rounded-xl items-center justify-center flex-row gap-2',
  ghost:     'py-2 items-center justify-center flex-row gap-2',
  danger:    'bg-red-600 py-3.5 rounded-xl items-center justify-center flex-row gap-2',
};

const TEXT_VARIANTS: Record<Variant, string> = {
  primary:   'text-white font-semibold text-base',
  secondary: 'text-gray-800 font-semibold text-base',
  ghost:     'text-brand font-medium text-base',
  danger:    'text-white font-semibold text-base',
};

export function Button({ label, onPress, disabled, loading, variant = 'primary', icon }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`${VARIANTS[variant]} ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'ghost' ? '#2563EB' : '#fff'} />
      ) : icon ? (
        <View>{icon}</View>
      ) : null}
      <Text className={TEXT_VARIANTS[variant]}>{label}</Text>
    </TouchableOpacity>
  );
}
