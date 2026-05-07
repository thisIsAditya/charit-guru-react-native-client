import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ActivityIndicator, BackHandler, Platform,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat } from '@ai-sdk/react';
import { fetch as expoFetch } from 'expo/fetch';
import { convertToCoreMessages } from 'ai';
import type { CoreUserMessage } from 'ai';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ChevronLeft, Paperclip } from 'lucide-react-native';
import { authClient } from '@/lib/auth-client';
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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [conversationTitle, setConversationTitle] = useState('New conversation');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('default');
  const [mcpContext, setMcpContext] = useState<McpContextRef | null>(null);
  const [showMcpPanel, setShowMcpPanel] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Hide the tab bar while inside a conversation and restore on leave
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => parent?.setOptions({ tabBarStyle: undefined });
    }, [navigation]),
  );

  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        router.back();
        return true;
      });
      return () => handler.remove();
    }, []),
  );

  const { messages, input, setInput, append, setMessages, isLoading, error } = useChat({
    id: id as string,
    api: `${API}/v1/chat/message`,
    experimental_prepareRequestBody: ({ messages }) => {
      const coreMessages = convertToCoreMessages(messages);
      const lastUser = [...coreMessages].reverse().find(m => m.role === 'user') as CoreUserMessage | undefined;
      const content = lastUser?.content;
      const message =
        typeof content === 'string'
          ? content
          : (content?.find(p => p.type === 'text') as { type: 'text'; text: string } | undefined)?.text ?? '';

      return {
        message,
        conversation_id: id,
        ...(mcpContext ? { mcp_context: mcpContext } : {}),
      };
    },
    fetch: async (input, init) => {
      const cookie = authClient.getCookie();
      return expoFetch(input as string, {
        ...init,
        headers: { ...(init?.headers as Record<string, string> | undefined), cookie },
      } as never);
    },
    onFinish: () => {
      setMcpContext(null);
      // After the first exchange the server derives and saves the title — fetch it
      if (messages.length <= 2) refreshTitle();
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

  const refreshTitle = () => {
    apiClient.conversations.get(id).then(({ conversation }) => {
      if (conversation.title) setConversationTitle(conversation.title);
    }).catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      apiClient.conversations.get(id),
      apiClient.conversations.messages(id),
    ]).then(([{ conversation }, { messages: history }]) => {
      setIsReadOnly(conversation.is_read_only);
      if (conversation.title) setConversationTitle(conversation.title);
      if (history.length > 0) {
        setMessages(history.map(m => ({ id: m.id, role: m.role, content: m.content })));
      }
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isLoading]);

  const onSend = () => {
    if (!input.trim() || isReadOnly || isLoading) return;
    append({ role: 'user', content: input });
    setInput('');
  };

  const handleAttach = (provider: string) => {
    if (!isPaidPlan) {
      setUpgradeFeature('mcp_enabled');
      setUpgradeVisible(true);
      return;
    }
    setMcpContext({ provider: provider as never, label: `${provider} context`, thread_id: '' } as McpContextRef);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
          hitSlop={8}
        >
          <ChevronLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1}>
          {conversationTitle}
        </Text>
      </View>

      {/* Message list */}
      <FlatList
        ref={listRef}
        data={messages.filter((m) => !(m.role === 'assistant' && !m.content))}
        keyExtractor={(m) => m.id}
        extraData={messages}
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

      {/* Generic stream/network error */}
      {error && !error.message?.includes('UPGRADE') && !error.message?.includes('READ_ONLY') && (
        <Text className="text-red-500 text-xs text-center px-4 py-1 bg-red-50">
          Something went wrong. Please try again.
        </Text>
      )}

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
        <View
          className="flex-row items-end px-3 py-2 border-t border-gray-100 gap-2"
          style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }}
        >
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
              onChangeText={setInput}
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
