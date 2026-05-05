import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { apiClient } from '@/lib/api';
import { useSession } from '@/lib/store';
import { UpgradeSheet } from '@/components/plan/UpgradeSheet';
import { Button } from '@/components/ui/Button';

const STYLES = [
  { id: 'coach',       label: 'Coach',       desc: 'Balanced, direct, actionable' },
  { id: 'mentor',      label: 'Mentor',      desc: 'Warm, encouraging, reflective' },
  { id: 'strategist',  label: 'Strategist',  desc: 'Sharp, blunt, outcome-focused' },
  { id: 'philosopher', label: 'Philosopher', desc: 'Principles-first, thoughtful' },
];

const FOCUS_OPTIONS = [
  { id: 'politics',      label: 'Office Politics' },
  { id: 'productivity',  label: 'Productivity' },
  { id: 'communication', label: 'Communication' },
  { id: 'leadership',    label: 'Leadership' },
  { id: 'negotiation',   label: 'Negotiation' },
  { id: 'new_job',       label: 'Starting New Job' },
];

const DEPTHS = [
  { id: 'concise',  label: 'Concise',  desc: 'Bullet points, quick answers' },
  { id: 'balanced', label: 'Balanced', desc: '2–3 paragraphs' },
  { id: 'detailed', label: 'Detailed', desc: 'Full context, examples' },
];

const CHECKIN = [
  { id: 'weekly',      label: 'Weekly' },
  { id: 'fortnightly', label: 'Every 2 weeks' },
  { id: 'never',       label: 'Never' },
];

export default function GuruScreen() {
  const { plan, isPaidPlan } = useSession();
  const qc = useQueryClient();
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('default');

  const { data, isLoading } = useQuery({
    queryKey: ['guru'],
    queryFn: apiClient.guru.get,
  });

  const [form, setForm] = useState({
    guru_name: 'CareerGuru',
    style: 'coach',
    focus_areas: [] as string[],
    checkin_frequency: 'weekly',
    response_depth: 'balanced',
  });

  useEffect(() => {
    if (data?.customization) {
      setForm({ ...data.customization });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => apiClient.guru.update(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guru'] }); router.back(); },
  });

  const toggleFocus = (id: string) => {
    const limit = plan?.focus_areas_limit ?? 1;
    if (form.focus_areas.includes(id)) {
      setForm((f) => ({ ...f, focus_areas: f.focus_areas.filter((x) => x !== id) }));
      return;
    }
    if (form.focus_areas.length >= limit && !isPaidPlan) {
      setUpgradeFeature('focus_areas');
      setUpgradeVisible(true);
      return;
    }
    if (form.focus_areas.length >= limit) return;
    setForm((f) => ({ ...f, focus_areas: [...f.focus_areas, id] }));
  };

  if (isLoading) return <ActivityIndicator className="flex-1" color="#2563EB" />;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3" hitSlop={8}>
          <ChevronLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900 flex-1">My Guru</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
        {/* Name */}
        <View>
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Guru Name</Text>
          <TextInput
            value={form.guru_name}
            onChangeText={(t) => setForm((f) => ({ ...f, guru_name: t }))}
            maxLength={32}
            className="border border-gray-200 rounded-xl px-3 py-3 text-gray-900"
          />
        </View>

        {/* Style */}
        <View>
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Communication Style</Text>
          <View className="gap-2">
            {STYLES.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setForm((f) => ({ ...f, style: s.id }))}
                className={`flex-row items-center px-4 py-3 rounded-xl border ${form.style === s.id ? 'border-brand bg-blue-50' : 'border-gray-200'}`}
              >
                <View className={`w-4 h-4 rounded-full border-2 mr-3 items-center justify-center ${form.style === s.id ? 'border-brand' : 'border-gray-300'}`}>
                  {form.style === s.id && <View className="w-2 h-2 rounded-full bg-brand" />}
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-900">{s.label}</Text>
                  <Text className="text-xs text-gray-500">{s.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Focus areas */}
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Focus Areas</Text>
            <Text className="text-xs text-gray-400">Pick up to {plan?.focus_areas_limit ?? 1}</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {FOCUS_OPTIONS.map((f) => {
              const selected = form.focus_areas.includes(f.id);
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => toggleFocus(f.id)}
                  className={`px-3 py-2 rounded-full border ${selected ? 'border-brand bg-blue-50' : 'border-gray-200'}`}
                >
                  <Text className={`text-xs font-medium ${selected ? 'text-brand' : 'text-gray-600'}`}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Response depth */}
        <View>
          <View className="flex-row items-center gap-1.5 mb-2">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Response Depth</Text>
            {plan?.response_depth_locked && !isPaidPlan && <Lock size={12} color="#9CA3AF" />}
          </View>
          <View className="flex-row gap-2">
            {DEPTHS.map((d) => {
              const locked = plan?.response_depth_locked && d.id !== 'balanced';
              return (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => {
                    if (locked) { setUpgradeFeature('response_depth'); setUpgradeVisible(true); return; }
                    setForm((f) => ({ ...f, response_depth: d.id }));
                  }}
                  className={`flex-1 border rounded-xl p-3 items-center ${form.response_depth === d.id && !locked ? 'border-brand bg-blue-50' : 'border-gray-200'} ${locked ? 'opacity-50' : ''}`}
                >
                  <Text className={`text-xs font-medium ${form.response_depth === d.id && !locked ? 'text-brand' : 'text-gray-700'}`}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Check-in frequency */}
        <View>
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Check-In Reminders</Text>
          <View className="flex-row gap-2">
            {CHECKIN.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setForm((f) => ({ ...f, checkin_frequency: c.id }))}
                className={`flex-1 border rounded-xl py-2.5 items-center ${form.checkin_frequency === c.id ? 'border-brand bg-blue-50' : 'border-gray-200'}`}
              >
                <Text className={`text-xs font-medium ${form.checkin_frequency === c.id ? 'text-brand' : 'text-gray-600'}`}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button label={mutation.isPending ? 'Saving…' : 'Save Changes'} onPress={() => mutation.mutate()} loading={mutation.isPending} />
      </ScrollView>

      <UpgradeSheet visible={upgradeVisible} onClose={() => setUpgradeVisible(false)} feature={upgradeFeature} />
    </View>
  );
}
