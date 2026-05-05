import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';

interface Props { daysLeft: number }

export function TrialBanner({ daysLeft }: Props) {
  const isUrgent = daysLeft <= 1;

  return (
    <View className={`flex-row items-center px-4 py-2.5 gap-2 ${isUrgent ? 'bg-red-500' : 'bg-amber-500'}`}>
      <AlertCircle size={15} color="#fff" />
      <Text className="text-white text-xs font-medium flex-1">
        {daysLeft === 0
          ? 'Your trial has ended — upgrade to keep chatting'
          : `Trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}
      </Text>
      <TouchableOpacity onPress={() => router.push('/(app)/profile/upgrade')}>
        <Text className="text-white text-xs font-bold underline">Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}
