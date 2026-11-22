import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { DEBOUNCE_MS } from '../features/songSearch/constants';
import { searchSongs } from '../features/songSearch/itunes';
import { ArtworkCandidate, extractUniqueArtworkCandidates } from '../lib/artworkSearch';
import { pickLocalArtwork } from '../lib/localArtwork';

const GRID_COLUMNS = 3;
const TOAST_DURATION_MS = 2200;

type PendingSelection =
  | { kind: 'search'; artworkUrl: string; title: string; artist: string }
  | { kind: 'local'; artworkUrl: string }
  | { kind: 'remove' };

interface Props {
  visible: boolean;
  initialQuery: string;
  artistHint?: string;
  currentArtworkUrl: string | null;
  onSelect: (artworkUrl: string | null) => void;
  onClose: () => void;
}

/** 曲のアルバムアートだけを検索・端末選択・解除できるモーダル（U17 #146）。曲名や履歴は変更しない。 */
export function ArtworkPickerModal({
  visible,
  initialQuery,
  artistHint,
  currentArtworkUrl,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ArtworkCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    const mySeq = ++seqRef.current;
    if (!trimmed) {
      setItems([]);
      setLoading(false);
      setHasError(false);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasError(false);
    const result = await searchSongs(trimmed, 'keyword');
    if (seqRef.current !== mySeq) return;
    setLoading(false);
    setHasSearched(true);
    if (!result.ok) {
      setItems([]);
      setHasError(true);
      return;
    }
    setItems(extractUniqueArtworkCandidates(result.items));
  }, []);

  // モーダルを開いたときに状態を初期化し、曲名・アーティスト名で初期検索する
  useEffect(() => {
    if (!visible) {
      seqRef.current += 1;
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      setPending(null);
      setToastMessage(null);
      return;
    }
    setQuery(initialQuery);
    setItems([]);
    setHasError(false);
    setHasSearched(false);
    setPending(null);
    setToastMessage(null);
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

  async function handlePickLocalPhoto() {
    if (Platform.OS === 'web') {
      showToast('端末の写真はモバイルアプリから選択できます');
      return;
    }
    const result = await pickLocalArtwork();
    if (result.status === 'canceled') return;
    if (result.status === 'error') {
      showToast(result.message);
      return;
    }
    setPending({ kind: 'local', artworkUrl: result.uri });
  }

  function handlePressCandidate(item: ArtworkCandidate) {
    if (currentArtworkUrl && currentArtworkUrl === item.artworkUrl) {
      showToast('現在設定中の画像です');
      return;
    }
    setPending({
      kind: 'search',
      artworkUrl: item.artworkUrl,
      title: item.title,
      artist: item.artist,
    });
  }

  function handleConfirmPending() {
    if (!pending) return;
    if (pending.kind === 'remove') {
      onSelect(null);
    } else {
      onSelect(pending.artworkUrl);
    }
    setPending(null);
  }

  function handleRequestClose() {
    if (pending) {
      setPending(null);
      return;
    }
    onClose();
  }

  const exampleArtist = artistHint?.trim() || 'アーティスト名';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleRequestClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerSideLeft}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.cancelText} numberOfLines={1}>変更せず戻る</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>画像を変更</Text>
            <Text style={styles.subtitle} numberOfLines={1}>画像のみ変更・曲情報は保持</Text>
          </View>
          <View style={styles.headerSideRight}>
            {currentArtworkUrl && (
              <TouchableOpacity
                onPress={() => setPending({ kind: 'remove' })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="画像を外す"
              >
                <Text style={styles.removeHeaderText} numberOfLines={1}>画像を外す</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 検索バー + 案1：端末の写真から選ぶ */}
        <View style={styles.topControls}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={searchInputRef}
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
                  <Text style={styles.searchClearText}>×</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.localBtn}
            onPress={() => void handlePickLocalPhoto()}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="端末の写真から選ぶ"
          >
            <Text style={styles.localBtnIcon}>🖼️</Text>
            <Text style={styles.localBtnText}>端末の写真から選ぶ</Text>
            <Text style={styles.localBtnChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 本文エリア：検索中 / 通信エラー / 未入力 / 0件 / 3列グリッド */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.stateTitle}>画像を検索中...</Text>
          </View>
        ) : hasError ? (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>画像を検索できませんでした</Text>
            <Text style={styles.stateDesc}>
              {`通信状況を確認して、もう一度お試しください。\n検索語「${query.trim()}」は保持されています。`}
            </Text>
            <TouchableOpacity style={styles.stateBtn} onPress={() => void runSearch(query)}>
              <Text style={styles.stateBtnText}>もう一度検索する</Text>
            </TouchableOpacity>
          </View>
        ) : !query.trim() ? (
          <View style={styles.centerState}>
            <Text style={styles.stateDesc}>
              曲名やアーティスト名で検索するか、上のボタンから端末の写真を選べます
            </Text>
          </View>
        ) : hasSearched && items.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>画像が見つかりませんでした</Text>
            <Text style={styles.stateDesc}>
              {`曲名を短くするか、アーティスト名だけで\n検索してみてください。例：${exampleArtist}`}
            </Text>
            <TouchableOpacity
              style={styles.stateBtn}
              onPress={() => searchInputRef.current?.focus()}
            >
              <Text style={styles.stateBtnText}>検索語を変更する</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>検索結果（タップして比較・確認）</Text>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.trackId)}
              numColumns={GRID_COLUMNS}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 24 }]}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isCurrent = currentArtworkUrl === item.artworkUrl;
                return (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => handlePressCandidate(item)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title} ${item.artist} の画像を確認${isCurrent ? '（現在設定中）' : ''}`}
                  >
                    <View style={styles.thumbWrap}>
                      <Image source={{ uri: item.artworkUrl }} style={styles.thumb} resizeMode="cover" />
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>現在</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardArtist} numberOfLines={1}>{item.artist || '—'}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}

        {/* D. 同じ画像を選んだときの軽いトースト通知（操作を止めない） */}
        {toastMessage && (
          <View
            pointerEvents="none"
            style={[styles.toastWrap, { bottom: insets.bottom + 18 }]}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          </View>
        )}

        {/* C / E / F. 比較確認モーダル（中央オーバーレイ） */}
        {pending && (
          <View style={styles.compareOverlay}>
            <TouchableWithoutFeedback onPress={() => setPending(null)}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
            <View style={styles.compareDialog}>
              <Text style={styles.compareTitle}>
                {pending.kind === 'remove' ? '画像を未設定に戻しますか？' : 'この画像に変更しますか？'}
              </Text>

              {/* ビフォー → アフター横並び比較 */}
              <View style={styles.beforeAfterRow}>
                <View style={styles.compareCol}>
                  <Text style={styles.beforeLabel}>変更前</Text>
                  <View style={styles.beforeImgBox}>
                    {currentArtworkUrl ? (
                      <Image source={{ uri: currentArtworkUrl }} style={styles.compareImg} resizeMode="cover" />
                    ) : (
                      <Text style={styles.compareEmoji}>🎵</Text>
                    )}
                  </View>
                </View>

                <Text style={styles.compareArrow}>→</Text>

                <View style={styles.compareCol}>
                  <Text style={styles.afterLabel}>変更後</Text>
                  <View style={[styles.afterImgBox, pending.kind === 'remove' && styles.afterImgBoxRemoved]}>
                    {pending.kind === 'remove' ? (
                      <Text style={styles.compareEmoji}>🎵</Text>
                    ) : (
                      <Image source={{ uri: pending.artworkUrl }} style={styles.compareImg} resizeMode="cover" />
                    )}
                  </View>
                </View>
              </View>

              {/* 省略なしの詳細テキストと保存境界の案内 */}
              <View style={styles.compareInfo}>
                {pending.kind === 'search' ? (
                  <>
                    <Text style={styles.compareDetailTitle}>{pending.title}</Text>
                    <Text style={styles.compareDetailSub}>{pending.artist || '—'}</Text>
                    <Text style={styles.compareNote}>次の編集画面で保存すると確定します。</Text>
                  </>
                ) : pending.kind === 'local' ? (
                  <>
                    <Text style={styles.compareDetailTitle}>端末から選んだ写真</Text>
                    <Text style={styles.compareNote}>
                      {'次の編集画面で保存すると確定します。\n※ 端末の画像はバックアップ復元に含まれません'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.compareDetailTitle}>アルバムアートを外す</Text>
                    <Text style={styles.compareDetailSub}>曲一覧・詳細では 🎵 アイコンが表示されます</Text>
                    <Text style={styles.compareNote}>
                      {'この時点では未保存です。\n次の編集画面で保存すると確定します。'}
                    </Text>
                  </>
                )}
              </View>

              {/* アクションボタン */}
              <View style={styles.compareActions}>
                <TouchableOpacity style={styles.comparePrimaryBtn} onPress={handleConfirmPending}>
                  <Text style={styles.comparePrimaryBtnText}>
                    {pending.kind === 'remove' ? '画像を外して編集に戻る' : 'この画像を選んで戻る'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.compareSecondaryBtn} onPress={() => setPending(null)}>
                  <Text style={styles.compareSecondaryBtnText}>候補一覧に戻る</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSideLeft: {
    minWidth: 82,
    alignItems: 'flex-start',
  },
  headerSideRight: {
    minWidth: 82,
    alignItems: 'flex-end',
  },
  cancelText: {
    fontSize: 12,
    color: colors.text2,
  },
  removeHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.red,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.jakartaBold,
    fontSize: 15,
    color: colors.text,
  },
  subtitle: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 1,
  },
  topControls: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
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
    fontSize: 11,
    fontWeight: '700',
  },
  localBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  localBtnIcon: {
    fontSize: 14,
  },
  localBtnText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  localBtnChevron: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text2,
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: 12,
    color: colors.text3,
    textAlign: 'center',
    lineHeight: 18,
  },
  stateBtn: {
    marginTop: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 11,
  },
  stateBtnText: {
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
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
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
  currentBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: colors.white,
    fontSize: 9,
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
  toastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  toastText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  compareOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  compareDialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  compareTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  beforeAfterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  compareCol: {
    alignItems: 'center',
    gap: 6,
  },
  beforeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
  },
  afterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  beforeImgBox: {
    width: 104,
    height: 104,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  afterImgBox: {
    width: 104,
    height: 104,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  afterImgBoxRemoved: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  compareImg: {
    width: '100%',
    height: '100%',
  },
  compareEmoji: {
    fontSize: 28,
  },
  compareArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 18,
  },
  compareInfo: {
    width: '100%',
    alignItems: 'center',
    gap: 3,
  },
  compareDetailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  compareDetailSub: {
    fontSize: 11,
    color: colors.text2,
    textAlign: 'center',
  },
  compareNote: {
    fontSize: 10,
    color: colors.text3,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 2,
  },
  compareActions: {
    width: '100%',
    gap: 8,
  },
  comparePrimaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  comparePrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  compareSecondaryBtn: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  compareSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text2,
  },
});
