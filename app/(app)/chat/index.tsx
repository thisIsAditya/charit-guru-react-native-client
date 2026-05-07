import {
  View, Text, FlatList, TouchableOpacity, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, MessageCircle, Lock, Trash2, X, CheckCircle, Circle } from 'lucide-react-native';
import { useState, useCallback } from 'react';
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

function ConversationRow({
  item,
  selectMode,
  selected,
  onToggle,
}: {
  item: Conversation;
  selectMode: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
    const handlePress = () => {
    if (selectMode) {
      onToggle(item.id);
    } else {
      router.push(`/(app)/chat/${item.id}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={() => !selectMode && onToggle(item.id)}
      className="flex-row items-center px-4 py-4 border-b border-gray-50 active:bg-gray-50"
    >
      {selectMode ? (
        <View className="mr-3">
          {selected
            ? <CheckCircle size={22} color="#2563EB" />
            : <Circle size={22} color="#D1D5DB" />}
        </View>
      ) : (
        <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${item.is_read_only ? 'bg-gray-100' : 'bg-brand-light'}`}>
          {item.is_read_only
            ? <Lock size={16} color="#9CA3AF" />
            : <MessageCircle size={16} color="#2563EB" />}
        </View>
      )}
      <View className="flex-1 min-w-0">
        <Text className="text-gray-900 font-medium text-sm" numberOfLines={1}>
          {item.title ?? 'New conversation'}
        </Text>
        <Text className="text-gray-400 text-xs mt-0.5">
          {item.is_read_only ? 'Ended · ' : ''}{timeAgo(item.last_turn_at)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ConversationsScreen() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.conversations.list(30),
  });

  // Refetch whenever this screen comes back into focus (e.g. after returning from a chat)
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }, [qc]),
  );

  const [isCreating, setIsCreating] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNewChat = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const { conversation } = await apiClient.conversations.create();
      router.push(`/(app)/chat/${conversation.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (!selectMode) setSelectMode(true);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0 || isDeleting) return;
    setIsDeleting(true);
    try {
      await Promise.all([...selected].map(id => apiClient.conversations.delete(id)));
      await qc.invalidateQueries({ queryKey: ['conversations'] });
      exitSelectMode();
    } finally {
      setIsDeleting(false);
    }
  };

  const conversations = data?.conversations ?? [];

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-gray-100">
        {selectMode ? (
          <>
            <TouchableOpacity onPress={exitSelectMode} className="p-1" hitSlop={8}>
              <X size={22} color="#374151" />
            </TouchableOpacity>
            <Text className="text-sm font-medium text-gray-700">
              {selected.size} selected
            </Text>
            <TouchableOpacity
              onPress={handleBulkDelete}
              disabled={selected.size === 0 || isDeleting}
              className="flex-row items-center gap-1.5 bg-red-500 px-3 py-1.5 rounded-xl"
            >
              {isDeleting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Trash2 size={15} color="#fff" />}
              <Text className="text-white text-sm font-semibold">
                Delete{selected.size > 0 ? ` (${selected.size})` : ''}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text className="text-xl font-bold text-gray-900">CareerGuru</Text>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563EB" />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <MessageCircle size={40} color="#D1D5DB" />
          <Text className="text-gray-500 text-base mt-4 text-center">
            Start a conversation with your career mentor
          </Text>
          <TouchableOpacity
            onPress={handleNewChat}
            disabled={isCreating}
            className="bg-brand px-6 py-3 rounded-xl mt-5 flex-row items-center gap-2"
          >
            {isCreating && <ActivityIndicator size="small" color="#fff" />}
            <Text className="text-white font-semibold">Start chatting</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              selectMode={selectMode}
              selected={selected.has(item.id)}
              onToggle={toggleSelect}
            />
          )}
          contentContainerStyle={{ paddingBottom: 96 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563EB" />
          }
        />
      )}

      {/* Floating action button */}
      {!selectMode && (
        <TouchableOpacity
          onPress={handleNewChat}
          disabled={isCreating}
          className="absolute bottom-6 right-5 w-14 h-14 bg-brand rounded-full items-center justify-center"
          style={{ elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 }}
        >
          {isCreating
            ? <ActivityIndicator size="small" color="#fff" />
            : <Plus size={24} color="#fff" />}
        </TouchableOpacity>
      )}
    </View>
  );
}
