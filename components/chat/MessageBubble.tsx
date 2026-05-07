import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import type { Message } from 'ai';

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
  },
  strong: {
    fontWeight: '600',
    color: '#1F2937',
  },
  bullet_list: {
    marginVertical: 2,
  },
  bullet_list_icon: {
    marginTop: 5,
    color: '#6B7280',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 4,
  },
  // Suppress heading styles — LLM is instructed not to use them,
  // but these neutralize them if they slip through.
  heading1: { fontSize: 14, fontWeight: '600' },
  heading2: { fontSize: 14, fontWeight: '600' },
  heading3: { fontSize: 14, fontWeight: '600' },
  code_inline: {
    fontFamily: 'monospace',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
});

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <View className={`flex-row mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <View className="w-7 h-7 rounded-full bg-brand items-center justify-center mr-2 mt-1 shrink-0">
          <Text className="text-white text-xs font-bold">G</Text>
        </View>
      )}
      <View
        className={`max-w-[78%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-brand rounded-tr-sm'
            : 'bg-gray-100 rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <Text className="text-sm leading-5 text-white">
            {message.content}
          </Text>
        ) : (
          <Markdown style={markdownStyles}>
            {message.content}
          </Markdown>
        )}
      </View>
    </View>
  );
}
