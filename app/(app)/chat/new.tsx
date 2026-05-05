import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '@/lib/api';

export default function NewChatScreen() {
  useEffect(() => {
    apiClient.conversations.create().then(({ conversation }) => {
      router.replace(`/(app)/chat/${conversation.id}`);
    }).catch(() => {
      router.back();
    });
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}
