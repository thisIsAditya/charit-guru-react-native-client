import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:8000',
  basePath: '/v1/auth',
  plugins: [
    expoClient({
      scheme: 'careerguru',
      storagePrefix: 'careerguru',
      storage: SecureStore,
    }),
  ],
});
