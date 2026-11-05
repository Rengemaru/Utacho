// 検索キーワード履歴のチップ表示（#91）。iTunes 検索モーダルとホームフィルタで共用。
// タップで再検索、チップ内 ✕ で1件削除、「全消去」で全削除。

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

type Props = {
  history: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
};

export function SearchHistoryChips({ history, onSelect, onRemove, onClear }: Props) {
  if (history.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>最近の検索</Text>
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="検索履歴を全消去"
        >
          <Text style={styles.clearText}>全消去</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        keyboardShouldPersistTaps="handled"
      >
        {history.map((term) => (
          <View key={term} style={styles.chip}>
            <TouchableOpacity
              onPress={() => onSelect(term)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 0 }}
              accessibilityRole="button"
              accessibilityLabel={`「${term}」で再検索`}
            >
              <Text style={styles.chipText} numberOfLines={1}>{term}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRemove(term)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`「${term}」を履歴から削除`}
            >
              <Text style={styles.chipRemove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heading: { fontSize: 11, color: colors.text3, fontWeight: '600' },
  clearText: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  chipRow: { gap: 6, paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 6,
    maxWidth: 200,
  },
  chipText: { fontSize: 12, color: colors.text },
  chipRemove: { fontSize: 10, color: colors.text3 },
});
