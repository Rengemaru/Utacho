import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { DEBOUNCE_MS } from '../features/songSearch/constants';
import { searchSongs } from '../features/songSearch/itunes';
import { ArtworkCandidate, extractUniqueArtworkCandidates } from '../lib/artworkSearch';

const GRID_COLUMNS = 3;

interface Props {
  visible: boolean;
  initialQuery: string;
  currentArtworkUrl: string | null;
  onSelect: (artworkUrl: string | null) => void;
  onClose: () => void;
}

/** 曲のアルバムアートだけを検索して差し替えるモーダル（U17 #146）。曲名や履歴は変更しない。 */
export function ArtworkPickerModal({
  visible,
  initialQuery,
  currentArtworkUrl,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ArtworkCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const seqRef = useRef(0);

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    const mySeq = ++seqRef.current;
    if (!trimmed) {
      setItems([]);
      setLoading(false);
      setErrorMessage(null);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const result = await searchSongs(trimmed, 'keyword');
    if (seqRef.current !== mySeq) return;
    setLoading(false);
    setHasSearched(true);
    if (!result.ok) {
      setItems([]);
      setErrorMessage('画像の検索に失敗しました。通信状況を確認してください。');
      return;
    }
    setItems(extractUniqueArtworkCandidates(result.items));
  }, []);

  // モーダルを開いたときに曲名・アーティスト名で初期検索する
  useEffect(() => {
    if (!visible) {
      seqRef.current += 1;
      return;
    }
    setQuery(initialQuery);
    setItems([]);
    setErrorMessage(null);
    setHasSearched(false);
    if (initialQuery.trim()) {
      void runSearch(initialQuery);
    }
  }, [visible, initialQuery, runSearch]);

  // 入力変更時のデバウンス検索
  useEffect(() => {
    if (!visible) return;
    if (query === initialQuery && !hasSearched) return;
    const timer = setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>画像を変更</Text>
            <Text style={styles.subtitle} numberOfLines={1}>アートのみ変更（曲名・履歴は保持）</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* 検索バー */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="曲名・アーティスト名で画像を検索"
              placeholderTextColor={colors.text3}
              returnKeyType="search"
              onSubmitEditing={() => void runSearch(query)}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="検索語をクリア"
              >
                <View style={styles.searchClear}>
                  <Text style={styles.searchClearText}>✕</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 検索結果グリッド */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.stateText}>画像を検索中...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void runSearch(query)}>
              <Text style={styles.retryBtnText}>再試行</Text>
            </TouchableOpacity>
          </View>
        ) : !query.trim() ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>曲名やアーティスト名を入力して画像を探せます</Text>
          </View>
        ) : hasSearched && items.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>一致する画像が見つかりませんでした</Text>
            <Text style={styles.stateSubText}>別のキーワードで検索してみてください</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.trackId)}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 96 }]}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = currentArtworkUrl === item.artworkUrl;
              return (
                <TouchableOpacity
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => onSelect(item.artworkUrl)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title} ${item.artist} の画像を選択`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.thumbWrap}>
                    <Image source={{ uri: item.artworkUrl }} style={styles.thumb} />
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardArtist} numberOfLines={1}>{item.artist || '—'}</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* 画像ありのときは未設定に戻す導線を下部に配置 */}
        {currentArtworkUrl && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onSelect(null)}
              accessibilityRole="button"
              accessibilityLabel="アルバムアートを未設定に戻す"
            >
              <Text style={styles.removeBtnText}>画像を未設定に戻す</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelBtn: {
    minWidth: 64,
  },
  cancelText: {
    fontSize: 14,
    color: colors.text2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    minWidth: 64,
  },
  title: {
    fontFamily: fonts.jakartaBold,
    fontSize: 15,
    color: colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 1,
  },
  searchWrap: {
    padding: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchIcon: {
    fontSize: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  searchClear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: {
    color: colors.white,
    fontSize: 10,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    color: colors.text2,
    textAlign: 'center',
  },
  stateSubText: {
    fontSize: 11,
    color: colors.text3,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  gridContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  gridRow: {
    gap: 8,
  },
  card: {
    flex: 1,
    maxWidth: '32%',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 6,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  thumbWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    marginBottom: 5,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  cardArtist: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  removeBtn: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text2,
  },
});
