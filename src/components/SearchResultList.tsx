import { ComponentProps } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { MusicSuggestion } from '../types';

// 候補が多くてもキーボードで隠れずスクロールできるよう、リストの高さを制限して内部スクロールさせる
const DEFAULT_MAX_HEIGHT = 240;

interface Props {
  items: MusicSuggestion[];
  onSelect: (item: MusicSuggestion) => void;
  maxHeight?: number;
  // 1.1.0 の検索モーダルで件数表示・「もっと見る」を差し込むための拡張口
  ListHeaderComponent?: ComponentProps<typeof FlatList>['ListHeaderComponent'];
  ListFooterComponent?: ComponentProps<typeof FlatList>['ListFooterComponent'];
}

/**
 * iTunes 検索候補の一覧。中身は FlatList で、親の ScrollView と入れ子にしても
 * keyboardShouldPersistTaps と nestedScrollEnabled で最後までスクロール・タップ選択できる。
 * fix-F（候補が View+map で見切れてスクロール不可）の修正用部品。1.1.0 の検索モーダルでも流用する。
 */
export function SearchResultList({
  items,
  onSelect,
  maxHeight = DEFAULT_MAX_HEIGHT,
  ListHeaderComponent,
  ListFooterComponent,
}: Props) {
  return (
    <FlatList
      style={{ maxHeight }}
      data={items}
      keyExtractor={(item, index) => `${item.trackId}-${index}`}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${item.trackName} ${item.artistName} を選択`}
        >
          {item.artworkUrl ? (
            <Image source={{ uri: item.artworkUrl }} style={styles.art} />
          ) : (
            <View style={[styles.art, styles.artPlaceholder]}>
              <Text style={styles.artPlaceholderText}>♪</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{item.trackName}</Text>
            <Text style={styles.artist} numberOfLines={1}>{item.artistName}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
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
});
