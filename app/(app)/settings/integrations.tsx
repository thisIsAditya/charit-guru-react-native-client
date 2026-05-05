import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Mail, Calendar, Hash, MessageSquare, Check, Plus } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSession } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { UpgradeSheet } from '@/components/plan/UpgradeSheet';
import { useState } from 'react';

const API = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:8000';

type Provider = 'gmail' | 'google_calendar' | 'slack' | 'teams';

const PROVIDERS: {
  id: Provider;
  label: string;
  desc: string;
  Icon: typeof Mail;
  authUrl: (redirectUri: string) => string;
}[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    desc: 'Attach email threads for specific advice',
    Icon: Mail,
    authUrl: (r) =>
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env['EXPO_PUBLIC_GOOGLE_CLIENT_ID']}&redirect_uri=${encodeURIComponent(r)}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline`,
  },
  {
    id: 'google_calendar',
    label: 'Calendar',
    desc: 'Include upcoming meetings in context',
    Icon: Calendar,
    authUrl: (r) =>
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env['EXPO_PUBLIC_GOOGLE_CLIENT_ID']}&redirect_uri=${encodeURIComponent(r)}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly&access_type=offline`,
  },
  {
    id: 'slack',
    label: 'Slack',
    desc: 'Attach Slack threads for advice',
    Icon: Hash,
    authUrl: (r) =>
      `https://slack.com/oauth/v2/authorize?client_id=${process.env['EXPO_PUBLIC_SLACK_CLIENT_ID']}&redirect_uri=${encodeURIComponent(r)}&scope=channels:history,channels:read`,
  },
  {
    id: 'teams',
    label: 'Microsoft Teams',
    desc: 'Access Teams messages and meeting notes',
    Icon: MessageSquare,
    authUrl: (r) =>
      `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env['EXPO_PUBLIC_TEAMS_CLIENT_ID']}&redirect_uri=${encodeURIComponent(r)}&response_type=code&scope=Chat.Read`,
  },
];

export default function IntegrationsScreen() {
  const { isPaidPlan } = useSession();
  const qc = useQueryClient();
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [connecting, setConnecting] = useState<Provider | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['mcp-connections'],
    queryFn: apiClient.mcp.connections,
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => apiClient.mcp.disconnect(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp-connections'] }),
  });

  const connect = async (provider: Provider, authUrl: string) => {
    if (!isPaidPlan) { setUpgradeVisible(true); return; }

    setConnecting(provider);
    try {
      const redirectUri = Linking.createURL('/oauth-callback');
      const result = await WebBrowser.openAuthSessionAsync(authUrl(redirectUri), redirectUri);

      if (result.type !== 'success') return;

      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      if (!code) return;

      // Exchange code for tokens via our backend proxy
      const res = await fetch(`${API}/v1/mcp/oauth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, code, redirect_uri: redirectUri }),
      });

      if (!res.ok) throw new Error('Token exchange failed');

      const { access_token, refresh_token, expires_at, scopes } = await res.json() as {
        access_token: string; refresh_token?: string; expires_at?: string; scopes?: string[];
      };

      await apiClient.mcp.connect({ provider, access_token, refresh_token, expires_at, scopes });
      qc.invalidateQueries({ queryKey: ['mcp-connections'] });
    } catch {
      Alert.alert('Connection failed', 'Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = (provider: Provider) => {
    Alert.alert('Disconnect', `Remove ${provider} integration?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => disconnectMutation.mutate(provider) },
    ]);
  };

  const connections = data?.connections ?? [];

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3" hitSlop={8}>
          <ChevronLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900">Integrations</Text>
      </View>

      {!isPaidPlan && (
        <View className="mx-4 mt-4 bg-blue-50 rounded-xl p-3">
          <Text className="text-blue-700 text-xs">Integrations are available on the Premium plan. Connect your workplace tools for hyper-specific career advice.</Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator className="mt-10" color="#2563EB" />
      ) : (
        <View className="px-4 mt-4 gap-3">
          {PROVIDERS.map(({ id, label, desc, Icon, authUrl }) => {
            const conn = connections.find((c) => c.provider === id && c.is_active);
            const isConnecting = connecting === id;

            return (
              <View
                key={id}
                className="flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5"
              >
                <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-3">
                  <Icon size={18} color="#374151" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">{label}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{desc}</Text>
                </View>
                {conn ? (
                  <TouchableOpacity
                    onPress={() => disconnect(id)}
                    className="flex-row items-center gap-1 bg-green-100 px-3 py-1.5 rounded-full"
                  >
                    <Check size={12} color="#15803D" />
                    <Text className="text-green-700 text-xs font-medium">Connected</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => connect(id, authUrl)}
                    disabled={isConnecting}
                    className="flex-row items-center gap-1 bg-brand px-3 py-1.5 rounded-full"
                  >
                    {isConnecting
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Plus size={12} color="#fff" />}
                    <Text className="text-white text-xs font-medium">Connect</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      <UpgradeSheet visible={upgradeVisible} onClose={() => setUpgradeVisible(false)} feature="mcp_enabled" />
    </View>
  );
}
