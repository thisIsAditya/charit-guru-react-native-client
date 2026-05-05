import { Tabs } from 'expo-router';
import { MessageCircle, User, Settings } from 'lucide-react-native';
import { TrialBanner } from '@/components/plan/TrialBanner';
import { View } from 'react-native';
import { useSession } from '@/lib/store';

export default function AppLayout() {
  const { trialDaysLeft, isPaidPlan } = useSession();

  return (
    <View className="flex-1 bg-white">
      {!isPaidPlan && trialDaysLeft <= 3 && (
        <TrialBanner daysLeft={trialDaysLeft} />
      )}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: { borderTopColor: '#E5E7EB', paddingBottom: 4 },
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
      </Tabs>
    </View>
  );
}
