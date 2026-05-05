import { View, Text, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ).start();

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View className="flex-row items-center mb-3">
      <View className="w-7 h-7 rounded-full bg-brand items-center justify-center mr-2">
        <Text className="text-white text-xs font-bold">G</Text>
      </View>
      <View className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex-row gap-1 items-center">
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400"
            style={{ transform: [{ translateY: dot }] }}
          />
        ))}
      </View>
    </View>
  );
}
