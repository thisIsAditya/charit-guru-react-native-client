import { View, Text, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/(auth)/callback',
      });
    } catch (err) {
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      <View className="items-center mb-12">
        <Text className="text-4xl font-bold text-gray-900 tracking-tight">CareerGuru</Text>
        <Text className="text-base text-gray-500 mt-2 text-center">
          Your always-on career mentor
        </Text>
      </View>

      <View className="w-full space-y-4">
        <Button
          label={loading ? 'Signing in…' : 'Continue with Google'}
          onPress={handleGoogleSignIn}
          disabled={loading}
          icon={
            loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-lg">G</Text>
            )
          }
        />
        {error ? (
          <Text className="text-red-500 text-sm text-center">{error}</Text>
        ) : null}
      </View>

      <Text className="text-xs text-gray-400 mt-8 text-center px-4">
        Start with a free 30-day trial. No credit card required.
      </Text>
    </View>
  );
}
