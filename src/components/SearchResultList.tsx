import { ComponentProps } from 'react';
import {
  FlatList,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../constants/colors';

// 1行に表示する正規化済みデータ。呼び出し側が toRow で任意の型から変換する
export interface SearchResultRow {
  key: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  meta?: string | null; // 右端の補助表示（発売年など）。任意
}

interface Props<T> {
  items: T[];
  toRow: (item: T) => SearchResultRow;
  onSelect: (item: T) => void;
  // 指定時はその高さで内部スクロール（インライン表示用）。未指定は親に合わせて伸縮（モーダル用）
  maxHeight?: number;
  style?: StyleProp<ViewStyle>;
  ListHeaderComponent?: ComponentProps<typeof FlatList>['ListHeaderComponent'];
  ListFooterComponent?: ComponentProps<typeof FlatList>['ListFooterComponent'];
  ListEmptyComponent?: ComponentProps<typeof FlatList>['ListEmptyComponent'];
}

/**
 * iTunes 検索候補の一覧。中身は FlatList（仮想化）で、キーボード表示中も
 * keyboardShouldPersistTaps で最後までスクロール・タップ選択できる。
 * 1.0.1 のインライン候補と 1.1.0 の検索モーダルの両方で流用する汎用部品。
 */
export function SearchResultList<T>({
  items,
  toRow,
  onSelect,
  maxHeight,
  style,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
}: Props<T>) {
  return (
    <FlatList
      style={[maxHeight != null ? { maxHeight } : styles.fill, style]}
      data={items}
      keyExtractor={(item) => toRow(item).key}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => {
        const row = toRow(item);
        return (
          <TouchableOpacity
            style={styles.row}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${row.title} ${row.artist} を選択`}
          >
            {row.artworkUrl ? (
              <Image source={{ uri: row.artworkUrl }} style={styles.art} />
            ) : (
              <View style={[styles.art, styles.artPlaceholder]}>
                <Text style={styles.artPlaceholderText}>♪</Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>{row.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{row.artist}</Text>
            </View>
            {row.meta ? <Text style={styles.meta}>{row.meta}</Text> : null}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  art: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  artPlaceholder: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artPlaceholderText: {
    fontSize: 16,
    color: colors.text3,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  artist: {
    fontSize: 11,
    color: colors.text2,
    marginTop: 2,
  },
  meta: {
    fontSize: 10,
    color: colors.text3,
  },
});
