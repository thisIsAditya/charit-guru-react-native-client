import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Check, Sparkles } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { apiClient } from '@/lib/api';
import { useSession } from '@/lib/store';

const RAZORPAY_KEY = process.env['EXPO_PUBLIC_RAZORPAY_KEY_ID'] ?? '';

type PlanId = 'premium' | 'pro';
type Freq = 'monthly' | 'quarterly' | 'annual';

const PLAN_FEATURES: Record<PlanId, string[]> = {
  premium: [
    '10 RAG chunks per query',
    'Unlimited memory access',
    'Gmail, Slack & Teams integration',
    '3 focus areas',
    'All response depth options',
    '90-day conversation history',
  ],
  pro: [
    'Everything in Premium',
    'Gemini 1.5 Pro (higher quality)',
    '15 RAG chunks — extended knowledge base',
    'Voice mode',
    '180-day conversation history',
  ],
};

const FREQ_LABELS: Record<Freq, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

function paise(v: number | null, freq: Freq): string {
  if (!v) return 'Free';
  const labels: Record<Freq, string> = { monthly: '/mo', quarterly: '/qtr', annual: '/yr' };
  return `₹${(v / 100).toLocaleString('en-IN')}${labels[freq]}`;
}

export default function UpgradeScreen() {
  const { user, setSession, setSubscription } = useSession();
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('premium');
  const [freq, setFreq] = useState<Freq>('monthly');
  const [loading, setLoading] = useState(false);

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: apiClient.plans.list,
  });

  const plans = plansData?.plans.filter((p) => p.id === 'premium' || p.id === 'pro') ?? [];
  const plan = plans.find((p) => p.id === selectedPlan);

  const handleSubscribe = async () => {
    if (!plan || !user) return;
    setLoading(true);
    try {
      const { subscriptionId } = await apiClient.billing.initiate(selectedPlan, freq);

      const data = await RazorpayCheckout.open({
        key: RAZORPAY_KEY,
        subscription_id: subscriptionId,
        name: 'CareerGuru',
        description: `${plan.display_name} — ${FREQ_LABELS[freq]}`,
        prefill: {
          name: user.name ?? user.email,
          email: user.email,
          method: 'upi',
        },
        theme: { color: '#2563EB' },
      });

      await apiClient.billing.verify({
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_subscription_id: data.razorpay_subscription_id,
        razorpay_signature: data.razorpay_signature,
        plan_id: selectedPlan,
      });

      // Refresh local state
      const [meRes, subRes] = await Promise.all([
        apiClient.auth.me(),
        apiClient.billing.subscription(),
      ]);
      setSession(meRes.user, meRes.plan);
      setSubscription(subRes.subscription);
      qc.invalidateQueries({ queryKey: ['subscription'] });

      Alert.alert('Welcome to Premium!', "You're all set. Enjoy the full CareerGuru experience.", [
        { text: 'Start chatting', onPress: () => router.replace('/(app)/chat') },
      ]);
    } catch (err: unknown) {
      const razorpayErr = err as { code?: string };
      if (razorpayErr?.code !== 'PAYMENT_CANCELLED') {
        Alert.alert('Payment failed', 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3" hitSlop={8}>
          <ChevronLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900">Upgrade CareerGuru</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Frequency toggle */}
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          {(['monthly', 'quarterly', 'annual'] as Freq[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFreq(f)}
              className={`flex-1 py-2 rounded-lg items-center ${freq === f ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-medium ${freq === f ? 'text-gray-900' : 'text-gray-500'}`}>
                {FREQ_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Plan cards */}
        {plans.map((p) => {
          const pid = p.id as PlanId;
          const priceKey = `price_paise_${freq}` as keyof typeof p;
          const price = p[priceKey] as number | null;
          const isSelected = selectedPlan === pid;

          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => setSelectedPlan(pid)}
              className={`border-2 rounded-2xl p-4 ${isSelected ? 'border-brand bg-blue-50' : 'border-gray-200 bg-white'}`}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-base font-bold text-gray-900">{p.display_name}</Text>
                <Text className="text-lg font-bold text-brand">{paise(price, freq)}</Text>
              </View>
              <Text className="text-gray-500 text-xs mb-3">{p.description}</Text>
              {PLAN_FEATURES[pid].map((f) => (
                <View key={f} className="flex-row items-center gap-2 mb-1.5">
                  <Check size={13} color="#2563EB" />
                  <Text className="text-gray-700 text-xs">{f}</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={handleSubscribe}
          disabled={loading || !plan}
          className={`bg-brand rounded-2xl py-4 items-center flex-row justify-center gap-2 mt-2 ${loading ? 'opacity-70' : ''}`}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Sparkles size={18} color="#fff" />}
          <Text className="text-white font-bold text-base">
            {loading ? 'Processing…' : `Subscribe with UPI`}
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-400 text-xs text-center">
          Secure UPI AutoPay · Cancel anytime from your UPI app
        </Text>
      </ScrollView>
    </View>
  );
}
