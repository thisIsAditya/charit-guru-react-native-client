import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Send, TicketCheck } from 'lucide-react-native';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type View_ = 'list' | 'create';

export default function SupportScreen() {
  const qc = useQueryClient();
  const [view, setView] = useState<View_>('list');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: apiClient.support.list,
  });

  const mutation = useMutation({
    mutationFn: () => apiClient.support.create(subject, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      setSubject('');
      setBody('');
      setView('list');
      Alert.alert('Ticket submitted', "We'll get back to you soon.");
    },
  });

  const statusVariant = (s: string): 'gray' | 'blue' | 'yellow' | 'green' => {
    const map: Record<string, 'gray' | 'blue' | 'yellow' | 'green'> = {
      open: 'blue', in_progress: 'yellow', resolved: 'green', closed: 'gray',
    };
    return map[s] ?? 'gray';
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => (view === 'create' ? setView('list') : router.back())} className="mr-3" hitSlop={8}>
          <ChevronLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900 flex-1">
          {view === 'create' ? 'New Ticket' : 'Support'}
        </Text>
        {view === 'list' && (
          <TouchableOpacity onPress={() => setView('create')} className="bg-brand px-3 py-1.5 rounded-lg">
            <Text className="text-white text-xs font-medium">New</Text>
          </TouchableOpacity>
        )}
      </View>

      {view === 'create' ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Briefly describe your issue"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-3 py-3 text-gray-900"
            />
          </View>
          <View>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Message</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Describe your issue in detail…"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="border border-gray-200 rounded-xl px-3 py-3 text-gray-900 min-h-32"
            />
          </View>
          <TouchableOpacity
            onPress={() => mutation.mutate()}
            disabled={!subject.trim() || !body.trim() || mutation.isPending}
            className={`bg-brand rounded-xl py-3.5 flex-row items-center justify-center gap-2 ${(!subject || !body) ? 'opacity-50' : ''}`}
          >
            {mutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Send size={16} color="#fff" />}
            <Text className="text-white font-semibold">{mutation.isPending ? 'Submitting…' : 'Submit Ticket'}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : isLoading ? (
        <ActivityIndicator className="mt-10" color="#2563EB" />
      ) : data?.tickets.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <TicketCheck size={40} color="#D1D5DB" />
          <Text className="text-gray-500 text-sm mt-4 text-center">No tickets yet. Need help? Tap New to reach us.</Text>
        </View>
      ) : (
        <FlatList
          data={data?.tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="border border-gray-200 rounded-2xl p-4 mb-3">
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-sm font-semibold text-gray-900 flex-1 mr-2" numberOfLines={2}>
                  {item.subject}
                </Text>
                <Badge label={item.status.replace('_', ' ')} variant={statusVariant(item.status)} />
              </View>
              <View className="flex-row items-center justify-between">
                {item.category && (
                  <Badge label={item.category} variant="gray" />
                )}
                <Text className="text-xs text-gray-400 ml-auto">{timeAgo(item.created_at)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
