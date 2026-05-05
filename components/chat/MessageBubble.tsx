import { View, Text } from 'react-native';
import type { Message } from 'ai';

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
        <Text className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-gray-800'}`}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}
