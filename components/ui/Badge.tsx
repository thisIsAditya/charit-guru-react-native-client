import { View, Text } from 'react-native';

type Variant = 'blue' | 'green' | 'yellow' | 'red' | 'gray';

const BG: Record<Variant, string> = {
  blue:   'bg-blue-100',
  green:  'bg-green-100',
  yellow: 'bg-yellow-100',
  red:    'bg-red-100',
  gray:   'bg-gray-100',
};

const FG: Record<Variant, string> = {
  blue:   'text-blue-700',
  green:  'text-green-700',
  yellow: 'text-yellow-700',
  red:    'text-red-700',
  gray:   'text-gray-700',
};

export function Badge({ label, variant = 'gray' }: { label: string; variant?: Variant }) {
  return (
    <View className={`self-start px-2 py-0.5 rounded-full ${BG[variant]}`}>
      <Text className={`text-xs font-medium ${FG[variant]}`}>{label}</Text>
    </View>
  );
}
