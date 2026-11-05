// 検索キーワード履歴のドロップダウン表示（#91 の UX 改善）。
// Google の検索欄のように、検索欄フォーカス時に縦リストで履歴を提示する。
// 検索欄の直下にフロート表示する想定で、呼び出し側が絶対配置のアンカー内に置く。

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

type Props = {
  history: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
  // リストが長いときの最大高さ（スクロール）。既定は約5件分。
  maxHeight?: number;
};

export function SearchHistoryDropdown({ history, onSelect, onRemove, onClear, maxHeight = 240 }: Props) {
  if (history.length === 0) return null;

  return (
    <View style={styles.dropdown}>
      <ScrollView
        style={{ maxHeight }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {history.map((term, i) => (
          <TouchableOpacity
            key={term}
            style={[styles.row, i > 0 && styles.rowBorder]}
            onPress={() => onSelect(term)}
            accessibilityRole="button"
            accessibilityLabel={`「${term}」で再検索`}
          >
            <Text style={styles.clock}>🕐</Text>
            <Text style={styles.term} numberOfLines={1}>{term}</Text>
            <TouchableOpacity
              onPress={() => onRemove(term)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={`「${term}」を履歴から削除`}
            >
              <Text style={styles.remove}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.clearRow}
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel="検索履歴をすべて消去"
      >
        <Text style={styles.clearText}>履歴をすべて消去</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    // フロート感を出す影（iOS/Android）
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clock: { fontSize: 13 },
  term: { flex: 1, fontSize: 13, color: colors.text },
  remove: { fontSize: 11, color: colors.text3 },
  clearRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  clearText: { fontSize: 12, color: colors.accent, fontWeight: '600' },
});
