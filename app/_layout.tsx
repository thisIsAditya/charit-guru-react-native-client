import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { authClient } from '@/lib/auth-client';
import { apiClient } from '@/lib/api';
import { useSession } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function SessionLoader() {
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
      } finally {
        SplashScreen.hideAsync();
      }
    })();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <SessionLoader />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
