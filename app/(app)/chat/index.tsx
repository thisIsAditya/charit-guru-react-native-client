import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, MessageCircle, Lock } from 'lucide-react-native';
import { apiClient } from '@/lib/api';
import type { Conversation } from '@/lib/api';

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function ConversationRow({ item }: { item: Conversation }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/chat/${item.id}`)}
      className="flex-row items-center px-4 py-4 border-b border-gray-50 active:bg-gray-50"
    >
      <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${item.is_read_only ? 'bg-gray-100' : 'bg-brand-light'}`}>
        {item.is_read_only
          ? <Lock size={16} color="#9CA3AF" />
          : <MessageCircle size={16} color="#2563EB" />}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-gray-900 font-medium text-sm" numberOfLines={1}>
          {item.title ?? 'New conversation'}
        </Text>
        <Text className="text-gray-400 text-xs mt-0.5">
          {item.is_read_only ? 'Ended · ' : ''}{timeAgo(item.last_turn_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ConversationsScreen() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.conversations.list(30),
  });

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">CareerGuru</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/chat/new')}
          className="w-9 h-9 bg-brand rounded-full items-center justify-center"
        >
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563EB" />
        </View>
      ) : data?.conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <MessageCircle size={40} color="#D1D5DB" />
          <Text className="text-gray-500 text-base mt-4 text-center">
            Start a conversation with your career mentor
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/chat/new')}
            className="bg-brand px-6 py-3 rounded-xl mt-5"
          >
            <Text className="text-white font-semibold">Start chatting</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationRow item={item} />}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563EB" />
          }
        />
      )}
    </View>
  );
}
