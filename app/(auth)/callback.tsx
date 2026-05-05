import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authClient } from '@/lib/auth-client';
import { apiClient } from '@/lib/api';
import { useSession } from '@/lib/store';

export default function CallbackScreen() {
  const { setSession, setSubscription } = useSession();
  const params = useLocalSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const sessionData = await authClient.getSession();
        if (!sessionData?.session) {
          router.replace('/(auth)/login');
          return;
        }

        // Store the session cookie for subsequent API calls
        const cookieHeader = `better-auth.session_token=${sessionData.session.token}`;
        await SecureStore.setItemAsync('session_cookie', cookieHeader);

        const [meRes, subRes] = await Promise.all([
          apiClient.auth.me(),
          apiClient.billing.subscription().catch(() => ({ subscription: null })),
        ]);

        setSession(meRes.user, meRes.plan);
        setSubscription(subRes.subscription);

        router.replace('/(app)/chat');
      } catch {
        router.replace('/(auth)/login');
      }
    })();
  }, [params]);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#2563EB" />
      <Text className="text-gray-500 mt-4">Setting up your account…</Text>
    </View>
  );
}
