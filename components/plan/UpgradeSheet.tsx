import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Sparkles, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

const FEATURE_COPY: Record<string, string> = {
  mcp_enabled: 'Connect Gmail, Slack, and Teams to get hyper-specific advice from your own workplace context.',
  rag_chunks: 'Access a deeper knowledge base with more book passages and articles.',
  response_depth: 'Unlock concise and detailed response modes — not just balanced.',
  focus_areas: 'Select up to 3 focus areas to bias your guru\'s advice.',
  default: 'Upgrade to Premium for the full CareerGuru experience.',
};

export function UpgradeSheet({ visible, onClose, feature }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#2563EB" />
              <Text className="text-lg font-bold text-gray-900">Premium Feature</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 text-sm leading-5 mb-6">
            {FEATURE_COPY[feature ?? 'default']}
          </Text>

          <View className="space-y-3">
            <Button
              label="Upgrade to Premium — ₹299/month"
              onPress={() => { onClose(); router.push('/(app)/profile/upgrade'); }}
            />
            <Button label="Maybe later" onPress={onClose} variant="ghost" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
