import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Sparkles, Plug, Bell, TicketCheck, ChevronRight } from 'lucide-react-native';
import { useSession } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';

const ITEMS = [
  { icon: Sparkles, label: 'My Guru',         sub: 'Personalise your career coach', href: '/(app)/settings/guru' },
  { icon: Plug,      label: 'Integrations',   sub: 'Connect Gmail, Slack, Teams',   href: '/(app)/settings/integrations', premiumOnly: true },
  { icon: Bell,      label: 'Notifications',  sub: 'Check-in and alert preferences', href: '/(app)/settings/notifications' },
  { icon: TicketCheck, label: 'Support',      sub: 'Get help or report an issue',    href: '/(app)/settings/support' },
];

export default function SettingsScreen() {
  const { isPaidPlan } = useSession();

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-5 pt-14 pb-5 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Settings</Text>
      </View>

      <View className="px-4 mt-3">
        {ITEMS.map(({ icon: Icon, label, sub, href, premiumOnly }) => (
          <TouchableOpacity
            key={label}
            onPress={() => router.push(href as never)}
            className="flex-row items-center py-4 border-b border-gray-50"
          >
            <View className="w-9 h-9 bg-gray-100 rounded-xl items-center justify-center mr-3">
              <Icon size={18} color="#374151" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-gray-900 text-sm font-medium">{label}</Text>
                {premiumOnly && !isPaidPlan && <Badge label="Premium" variant="blue" />}
              </View>
              <Text className="text-gray-400 text-xs mt-0.5">{sub}</Text>
            </View>
            <ChevronRight size={16} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
