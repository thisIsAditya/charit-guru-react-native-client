import {
  View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, LogOut, Brain, Lock, CreditCard } from 'lucide-react-native';
import { authClient } from '@/lib/auth-client';
import { apiClient } from '@/lib/api';
import { useSession } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PlanBadge({ planId }: { planId: string }) {
  const map: Record<string, 'blue' | 'green' | 'yellow' | 'gray'> = {
    free: 'gray', premium: 'blue', pro: 'green', enterprise: 'yellow',
  };
  return <Badge label={planId.charAt(0).toUpperCase() + planId.slice(1)} variant={map[planId] ?? 'gray'} />;
}

export default function ProfileScreen() {
  const { user, plan, trialDaysLeft, isTrialExpired, isPaidPlan, setSession, clearSession } = useSession();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    job_title: user?.job_title ?? '',
    company: user?.company ?? '',
    industry: user?.industry ?? '',
    years_of_experience: String(user?.years_of_experience ?? ''),
  });

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: apiClient.billing.subscription,
  });

  const { data: memData } = useQuery({
    queryKey: ['locked-memories'],
    queryFn: apiClient.memory.lockedCount,
    enabled: !isPaidPlan,
  });

  const updateMutation = useMutation({
    mutationFn: () => apiClient.auth.updateProfile({
      name: form.name || undefined,
      job_title: form.job_title || undefined,
      company: form.company || undefined,
      industry: form.industry || undefined,
      years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : undefined,
    }),
    onSuccess: async () => {
      const res = await apiClient.auth.me();
      setSession(res.user, res.plan);
      setEditing(false);
    },
  });

  const signOut = async () => {
    await authClient.signOut();
    await clearSession();
    router.replace('/(auth)/login');
  };

  if (!user || !plan) return <ActivityIndicator className="flex-1" />;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="px-5 pt-14 pb-5 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Profile</Text>
      </View>

      {/* Plan status card */}
      <View className="mx-4 mt-4 bg-gray-50 rounded-2xl p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <PlanBadge planId={plan.id} />
            {subData?.subscription?.status === 'active' && (
              <Text className="text-green-600 text-xs">● Active</Text>
            )}
          </View>
          {!isPaidPlan && (
            <TouchableOpacity onPress={() => router.push('/(app)/profile/upgrade')} className="flex-row items-center gap-1">
              <CreditCard size={14} color="#2563EB" />
              <Text className="text-brand text-xs font-semibold">Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isPaidPlan && (
          <View className={`rounded-xl px-3 py-2 ${isTrialExpired ? 'bg-red-50' : trialDaysLeft <= 3 ? 'bg-amber-50' : 'bg-blue-50'}`}>
            <Text className={`text-xs ${isTrialExpired ? 'text-red-700' : trialDaysLeft <= 3 ? 'text-amber-700' : 'text-blue-700'}`}>
              {isTrialExpired
                ? 'Trial ended — upgrade to continue using CareerGuru'
                : `Free trial · ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining`}
            </Text>
          </View>
        )}

        {isPaidPlan && subData?.subscription && (
          <Text className="text-gray-500 text-xs">
            Next renewal: {subData.subscription.current_period_end
              ? formatDate(subData.subscription.current_period_end)
              : '—'}
          </Text>
        )}
      </View>

      {/* Profile fields */}
      <View className="px-4 mt-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-gray-700 uppercase tracking-wide">About You</Text>
          <TouchableOpacity onPress={() => editing ? updateMutation.mutate() : setEditing(true)}>
            <Text className="text-brand text-sm font-medium">
              {editing ? (updateMutation.isPending ? 'Saving…' : 'Save') : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {[
          { label: 'Name', key: 'name', placeholder: 'Your name' },
          { label: 'Job Title', key: 'job_title', placeholder: 'e.g. Software Engineer' },
          { label: 'Company', key: 'company', placeholder: 'e.g. TechCorp' },
          { label: 'Industry', key: 'industry', placeholder: 'e.g. Technology' },
          { label: 'Years of Experience', key: 'years_of_experience', placeholder: '0', keyboardType: 'numeric' },
        ].map(({ label, key, placeholder, keyboardType }) => (
          <View key={key} className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">{label}</Text>
            {editing ? (
              <TextInput
                value={form[key as keyof typeof form]}
                onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={keyboardType as never}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm bg-white"
              />
            ) : (
              <Text className="text-gray-900 text-sm py-1">
                {form[key as keyof typeof form] || '—'}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Quick links */}
      <View className="px-4 mt-2 space-y-1">
        {[
          { icon: Brain, label: 'My Memories', onPress: () => router.push('/(app)/profile/memories') },
        ].map(({ icon: Icon, label, onPress }) => (
          <TouchableOpacity
            key={label}
            onPress={onPress}
            className="flex-row items-center py-3.5 border-b border-gray-50"
          >
            <Icon size={18} color="#6B7280" />
            <Text className="text-gray-700 text-sm ml-3 flex-1">{label}</Text>
            {!isPaidPlan && memData?.count ? (
              <Text className="text-xs text-amber-600 mr-2">{memData.count} locked</Text>
            ) : null}
            <ChevronRight size={16} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <View className="px-4 mt-6">
        <Button label="Sign Out" onPress={signOut} variant="secondary" />
      </View>
    </ScrollView>
  );
}
