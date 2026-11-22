import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

export const SAVE_TOAST_DURATION_MS = 2200;

interface Props {
  message: string | null;
  bottomOffset?: number;
}

/** 画面を圧迫せず次の操作を邪魔しない1行完了トースト（U24 #153） */
export function SaveToast({ message, bottomOffset = 14 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.stopAnimation();
    if (message) {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [message, opacity]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { bottom: bottomOffset, opacity }]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.toast}>
        <Text style={styles.check}>✓</Text>
        <Text style={styles.text} numberOfLines={1}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
    zIndex: 50,
  },
  toast: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  check: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
