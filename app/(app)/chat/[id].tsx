import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useChat } from '@ai-sdk/react';
import { fetch as expoFetch } from 'expo/fetch';
import { useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Send, ChevronLeft, Paperclip } from 'lucide-react-native';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ReadOnlyBanner } from '@/components/chat/ReadOnlyBanner';
import { MCPContextPanel, type McpContextRef } from '@/components/chat/MCPContextPanel';
import { UpgradeSheet } from '@/components/plan/UpgradeSheet';
import { useSession } from '@/lib/store';
import { apiClient } from '@/lib/api';

const API = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:8000';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPaidPlan, plan } = useSession();
  const [sessionCookie, setSessionCookie] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('default');
  const [mcpContext, setMcpContext] = useState<McpContextRef | null>(null);
  const [showMcpPanel, setShowMcpPanel] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    SecureStore.getItemAsync('session_cookie').then((c) => setSessionCookie(c ?? ''));
    // Check if conversation is already read-only
    apiClient.conversations.get(id).then(({ conversation }) => {
      setIsReadOnly(conversation.is_read_only);
    }).catch(() => {});
  }, [id]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: `${API}/v1/chat/message`,
    fetch: expoFetch,
    headers: { cookie: sessionCookie },
    body: {
      conversation_id: id,
      ...(mcpContext ? { mcp_context: mcpContext } : {}),
    },
    onFinish: () => {
      setMcpContext(null);
    },
    onError: (err) => {
      if (err.message?.includes('upgrade_required') || err.message?.includes('UPGRADE_REQUIRED')) {
        setUpgradeFeature('default');
        setUpgradeVisible(true);
      } else if (err.message?.includes('CONVERSATION_READ_ONLY')) {
        setIsReadOnly(true);
      }
    },
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isLoading]);

  const onSend = () => {
    if (!input.trim() || isReadOnly || isLoading) return;
    handleSubmit();
  };

  const handleAttach = (provider: string) => {
    if (!isPaidPlan) {
      setUpgradeFeature('mcp_enabled');
      setUpgradeVisible(true);
      return;
    }
    // In production, this would open a picker to select the specific thread/channel
    // For now, we show the panel — the full OAuth picker flow would go here
    setMcpContext({ provider: provider as never, label: `${provider} context`, thread_id: '' } as McpContextRef);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1" hitSlop={8}>
          <ChevronLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1}>
          {messages.length === 0 ? 'New conversation' : 'CareerGuru'}
        </Text>
      </View>

      {/* Message list */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View className="items-center justify-center pt-20 px-8">
            <View className="w-14 h-14 rounded-full bg-brand items-center justify-center mb-4">
              <Text className="text-white text-xl font-bold">G</Text>
            </View>
            <Text className="text-gray-900 font-semibold text-base text-center">
              {plan?.description ?? "I'm your career mentor"}
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
              Ask me anything about your career — negotiations, office politics, promotions, and more.
            </Text>
          </View>
        }
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
      />

      {/* MCP context attachment */}
      {isPaidPlan && showMcpPanel && (
        <MCPContextPanel
          attached={mcpContext}
          onClear={() => setMcpContext(null)}
          onAttach={handleAttach}
        />
      )}

      {/* Input / read-only */}
      {isReadOnly ? (
        <ReadOnlyBanner />
      ) : (
        <View className="flex-row items-end px-3 py-2 border-t border-gray-100 gap-2">
          {isPaidPlan && (
            <TouchableOpacity
              onPress={() => setShowMcpPanel(!showMcpPanel)}
              className="p-2.5 rounded-xl"
              hitSlop={8}
            >
              <Paperclip size={18} color={showMcpPanel ? '#2563EB' : '#9CA3AF'} />
            </TouchableOpacity>
          )}
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 max-h-28">
            <TextInput
              value={input}
              onChangeText={(t) => handleInputChange({ target: { value: t } } as never)}
              placeholder="Ask your career mentor…"
              placeholderTextColor="#9CA3AF"
              multiline
              className="text-gray-900 text-sm"
              editable={!isReadOnly && !isLoading}
            />
          </View>
          <TouchableOpacity
            onPress={onSend}
            disabled={!input.trim() || isLoading}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              input.trim() && !isLoading ? 'bg-brand' : 'bg-gray-200'
            }`}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Send size={16} color={input.trim() ? '#fff' : '#9CA3AF'} />}
          </TouchableOpacity>
        </View>
      )}

      <UpgradeSheet
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        feature={upgradeFeature}
      />
    </KeyboardAvoidingView>
  );
}
