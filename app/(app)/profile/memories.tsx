import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { apiClient } from '@/lib/api';
import { useSession } from '@/lib/store';
import { UpgradeSheet } from '@/components/plan/UpgradeSheet';
import { useState } from 'react';

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function MemoriesScreen() {
  const { isPaidPlan } = useSession();
  const qc = useQueryClient();
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const { data, isLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: apiClient.memory.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.memory.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memories'] }),
  });

  const deleteAllMutation = useMutation({
    mutationFn: apiClient.memory.deleteAll,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memories'] }),
  });

  const confirmDeleteAll = () =>
    Alert.alert('Reset All Memories', 'This will permanently delete all memories. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: () => deleteAllMutation.mutate() },
    ]);

  const memories = data?.memories ?? [];
  const locked = !isPaidPlan ? memories.filter((m) => new Date(m.created_at) < cutoff) : [];
  const accessible = isPaidPlan ? memories : memories.filter((m) => new Date(m.created_at) >= cutoff);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3" hitSlop={8}>
          <ChevronLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900 flex-1">My Memories</Text>
        {memories.length > 0 && (
          <TouchableOpacity onPress={confirmDeleteAll}>
            <Text className="text-red-500 text-sm">Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isPaidPlan && locked.length > 0 && (
        <TouchableOpacity
          onPress={() => setUpgradeVisible(true)}
          className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row items-center gap-2"
        >
          <Text className="text-amber-700 text-sm flex-1">
            {locked.length} memories are locked. Upgrade to access full history.
          </Text>
          <Text className="text-amber-700 font-semibold text-xs">Unlock →</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator className="mt-10" color="#2563EB" />
      ) : (
        <FlatList
          data={accessible}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="flex-row items-start py-3 border-b border-gray-50 gap-3">
              <View className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
              <Text className="text-gray-700 text-sm flex-1 leading-5">{item.memory}</Text>
              <View className="items-end gap-1">
                <Text className="text-gray-400 text-xs">{timeAgo(item.created_at)}</Text>
                <TouchableOpacity onPress={() => deleteMutation.mutate(item.id)} hitSlop={8}>
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-gray-400 text-sm text-center mt-10">No memories yet.</Text>
          }
        />
      )}

      <UpgradeSheet visible={upgradeVisible} onClose={() => setUpgradeVisible(false)} />
    </View>
  );
}
