import { View, Text, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from '@/lib/api';

async function registerPushToken() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = await Notifications.getExpoPushTokenAsync();
  const platform = Platform.OS as 'ios' | 'android';
  await apiClient.notifications.register(token.data, platform);
}

export default function NotificationsScreen() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: apiClient.notifications.preferences,
  });

  const mutation = useMutation({
    mutationFn: apiClient.notifications.updatePreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-prefs'] }),
  });

  const prefs = data?.preferences ?? { weekly_checkin: true, new_source_alerts: true };

  const toggle = (key: keyof typeof prefs, val: boolean) => {
    if (val) registerPushToken();
    mutation.mutate({ [key]: val });
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3" hitSlop={8}>
          <ChevronLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900">Notifications</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" color="#2563EB" />
      ) : (
        <View className="px-4 mt-4">
          {[
            { key: 'weekly_checkin', label: 'Weekly Check-In', desc: 'Career goal reminder every week' },
            { key: 'new_source_alerts', label: 'New Content Alerts', desc: 'When new books or guides are added' },
          ].map(({ key, label, desc }) => (
            <View key={key} className="flex-row items-center py-4 border-b border-gray-50">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">{label}</Text>
                <Text className="text-xs text-gray-400 mt-0.5">{desc}</Text>
              </View>
              <Switch
                value={prefs[key as keyof typeof prefs]}
                onValueChange={(v) => toggle(key as keyof typeof prefs, v)}
                trackColor={{ true: '#2563EB' }}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
