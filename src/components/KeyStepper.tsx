import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

// カラオケのキー変更の現実的な範囲（原曲比 ±7 程度）
const MIN_KEY = -7;
const MAX_KEY = 7;

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function KeyStepper({ value, onChange }: Props) {
  const atMin = value !== null && value <= MIN_KEY;
  const atMax = value !== null && value >= MAX_KEY;

  function decrement() {
    if (value === null) {
      onChange(-1);
    } else if (value > MIN_KEY) {
      onChange(value - 1);
    }
  }

  function increment() {
    if (value === null) {
      onChange(1);
    } else if (value < MAX_KEY) {
      onChange(value + 1);
    }
  }

  function reset() {
    onChange(null);
  }

  const displayValue =
    value === null ? '未設定' : value > 0 ? `+${value}` : `${value}`;
  const valueColor =
    value === null ? colors.text3 : value > 0 ? colors.green : colors.yellow;

  return (
    <View style={styles.container}>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.btn, atMin && styles.btnDisabled]}
          onPress={decrement}
          disabled={atMin}
        >
          <Text style={styles.btnText}>－</Text>
        </TouchableOpacity>
        <Text style={[styles.value, { color: valueColor }]}>{displayValue}</Text>
        <TouchableOpacity
          style={[styles.btn, atMax && styles.btnDisabled]}
          onPress={increment}
          disabled={atMax}
        >
          <Text style={styles.btnText}>＋</Text>
        </TouchableOpacity>
      </View>
      {value !== null && (
        <TouchableOpacity onPress={reset}>
          <Text style={styles.resetText}>未設定に戻す</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 22,
  },
  value: {
    fontFamily: 'DM Mono',
    fontSize: 18,
    fontWeight: '600',
    minWidth: 52,
    textAlign: 'center',
  },
  resetText: {
    fontSize: 10,
    color: colors.text3,
  },
});
