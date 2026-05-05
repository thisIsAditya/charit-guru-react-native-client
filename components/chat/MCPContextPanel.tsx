import { View, Text, TouchableOpacity } from 'react-native';
import { Mail, Hash, MessageSquare, X } from 'lucide-react-native';

export type McpContextRef =
  | { provider: 'gmail'; thread_id: string; label: string }
  | { provider: 'google_calendar'; label: string }
  | { provider: 'slack'; channel_id: string; thread_ts: string; label: string }
  | { provider: 'teams'; chat_id: string; label: string };

interface Props {
  attached: McpContextRef | null;
  onClear: () => void;
  onAttach: (provider: string) => void;
}

const PROVIDER_ICONS = {
  gmail: Mail,
  slack: Hash,
  teams: MessageSquare,
};

export function MCPContextPanel({ attached, onClear, onAttach }: Props) {
  if (attached) {
    return (
      <View className="flex-row items-center bg-blue-50 px-3 py-2 gap-2 border-b border-gray-100">
        <Mail size={14} color="#2563EB" />
        <Text className="text-blue-700 text-xs flex-1 font-medium">{attached.label}</Text>
        <TouchableOpacity onPress={onClear} hitSlop={8}>
          <X size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-row gap-2 px-3 py-2 border-b border-gray-100">
      {(['gmail', 'slack', 'teams'] as const).map((p) => {
        const Icon = PROVIDER_ICONS[p];
        return (
          <TouchableOpacity
            key={p}
            onPress={() => onAttach(p)}
            className="flex-row items-center gap-1 bg-gray-100 px-2.5 py-1.5 rounded-full"
          >
            <Icon size={12} color="#6B7280" />
            <Text className="text-gray-600 text-xs capitalize">{p}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
