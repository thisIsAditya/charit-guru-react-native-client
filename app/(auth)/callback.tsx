import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { authClient } from '@/lib/auth-client';
import { apiClient } from '@/lib/api';
import { useSession } from '@/lib/store';

export default function CallbackScreen() {
  const { setSession, setSubscription, clearSession } = useSession();

  useEffect(() => {
    (async () => {
      try {
        const sessionData = await authClient.getSession();
        if (!sessionData?.data?.session) {
          router.replace('/(auth)/login');
          return;
        }

        const [meRes, subRes] = await Promise.all([
          apiClient.auth.me(),
          apiClient.billing.subscription().catch(() => ({ subscription: null })),
        ]);

        setSession(meRes.user, meRes.plan);
        setSubscription(subRes.subscription);
        router.replace('/(app)/chat');
      } catch {
        await clearSession();
        router.replace('/(auth)/login');
      }
    })();
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#2563EB" />
      <Text className="text-gray-500 mt-4">Setting up your account…</Text>
    </View>
  );
}
