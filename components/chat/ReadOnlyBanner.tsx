import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';

export function ReadOnlyBanner() {
  return (
    <View className="bg-gray-100 border-t border-gray-200 px-4 py-3 flex-row items-center gap-3">
      <Lock size={14} color="#6B7280" />
      <Text className="text-gray-600 text-xs flex-1">
        This conversation has ended.
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(app)/chat/new')}
        className="bg-brand px-3 py-1.5 rounded-lg"
      >
        <Text className="text-white text-xs font-medium">New chat</Text>
      </TouchableOpacity>
    </View>
  );
}
