// 曲検索画面（フッター「さがす」タブの中身）。
// 旧・曲検索モーダルの 04b 検索画面を、選択画面（04a）なしでタブ内に直接表示する形にしたもの。
// 検索モード（曲から/アーティスト/キーワード）は検索欄の下のセグメントで切り替える。

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SearchResultList } from '../../components/SearchResultList';
import { SearchHistoryDropdown } from '../../components/SearchHistoryDropdown';
import {
  clearSearchHistory,
  deleteSearchHistoryEntry,
  getSearchHistory,
  pushSearchHistory,
} from '../../db/settings';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useCoachTarget } from '../../lib/coachTargets';
import { SearchMode, SongCandidate, SortKey } from './types';
import { useSongSearch } from './useSongSearch';

const HISTORY_KEY = 'search_history_itunes' as const;

const MODE_PLACEHOLDER: Record<SearchMode, string> = {
  song: '曲名で検索',
  artist: 'アーティスト名で検索',
  keyword: 'キーワードで検索',
};

const MODE_SEG: { key: SearchMode; label: string }[] = [
  { key: 'song', label: '曲から' },
  { key: 'artist', label: 'アーティスト' },
  { key: 'keyword', label: 'キーワード' },
];

const SORT_LABEL: Record<SortKey, string> = {
  relevance: '関連度順',
  releaseDesc: '発売日が新しい順',
  releaseAsc: '発売日が古い順',
  title: '曲名順',
};

const SORT_ORDER: SortKey[] = ['relevance', 'releaseDesc', 'releaseAsc', 'title'];

export type SongSearchViewHandle = {
  /** 検索欄にフォーカスを当てる（タブ表示時など） */
  focus: () => void;
  /** 履歴を読み直す（タブ表示時） */
  reloadHistory: () => void;
};

type Props = {
  onSelect: (candidate: SongCandidate) => void;
  onManual: () => void;
  bottomInset: number;
};

export const SongSearchView = forwardRef<SongSearchViewHandle, Props>(function SongSearchView(
  { onSelect, onManual, bottomInset },
  ref,
) {
  const search = useSongSearch();
  const { query, setQuery, mode, setMode, sortKey, changeSort, status, visibleItems, totalCount, hasMore, showMore, retry } = search;
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [history, setHistory] = useState<string[]>(() => (Platform.OS === 'web' ? [] : getSearchHistory(HISTORY_KEY)));
  // 履歴ドロップダウンはホームと同様フォーカス連動（検索欄から離れたら閉じる）
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const searchTargetRef = useCoachTarget('search-input');
  const manualTargetRef = useCoachTarget('manual-entry');

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    reloadHistory: () => {
      if (Platform.OS !== 'web') setHistory(getSearchHistory(HISTORY_KEY));
    },
  }), []);

  const showSortRow = status === 'complete' || status === 'truncated';

  // 検索キーワードを履歴へ記録（#91）。空・web は無視
  const recordHistory = useCallback((term: string) => {
    if (Platform.OS === 'web' || !term.trim()) return;
    setHistory(pushSearchHistory(HISTORY_KEY, term));
  }, []);

  const removeHistory = useCallback((term: string) => {
    if (Platform.OS === 'web') return;
    setHistory(deleteSearchHistoryEntry(HISTORY_KEY, term));
  }, []);

  const clearHistory = useCallback(() => {
    if (Platform.OS === 'web') return;
    clearSearchHistory(HISTORY_KEY);
    setHistory([]);
  }, []);

  // 候補選択時はそのときの検索語を履歴へ残してから確定する
  const handleSelect = useCallback(
    (candidate: SongCandidate) => {
      recordHistory(query);
      onSelect(candidate);
    },
    [recordHistory, query, onSelect],
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>さがす</Text>
        {/* 手入力の導線は常に見える位置に置く（検索前・後・失敗時いつでも押せる） */}
        <View ref={manualTargetRef} collapsable={false}>
        <TouchableOpacity
          style={styles.manualPill}
          onPress={onManual}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="手入力で登録"
        >
          <Text style={styles.manualPillText}>✏️ 手入力で登録</Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* 検索欄（履歴ドロップダウンのアンカー） */}
      <View>
        <View style={styles.sInput} ref={searchTargetRef} collapsable={false}>
          <Text style={styles.sIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.sField}
            value={query}
            onChangeText={setQuery}
            placeholder={MODE_PLACEHOLDER[mode]}
            placeholderTextColor={colors.text3}
            returnKeyType="search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={() => recordHistory(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="入力を消す"
            >
              <View style={styles.sClear}>
                <Text style={styles.sClearText}>✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 検索欄フォーカス中かつ検索前（idle）のとき、検索欄直下に履歴ドロップダウンを表示（#91） */}
        {searchFocused && status === 'idle' && history.length > 0 && (
          <View style={styles.historyDropdownAnchor}>
            <SearchHistoryDropdown
              history={history}
              onSelect={setQuery}
              onRemove={removeHistory}
              onClear={clearHistory}
            />
          </View>
        )}
      </View>

      {/* モード切り替え */}
      <View style={styles.modeSeg}>
        {MODE_SEG.map((m) => {
          const on = m.key === mode;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeItem, on && styles.modeItemOn]}
              onPress={() => setMode(m.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.modeText, on && styles.modeTextOn]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 件数・並び替え */}
      {showSortRow && (
        <View style={styles.metaWrap}>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              <Text style={styles.metaCount}>{status === 'truncated' ? '上位200件' : `${totalCount}件`}</Text>
            </Text>
            <TouchableOpacity
              style={[styles.sortChip, sortMenuOpen && styles.sortChipOpen]}
              onPress={() => setSortMenuOpen(!sortMenuOpen)}
              accessibilityRole="button"
              accessibilityLabel="並び替え"
            >
              <Text style={[styles.sortChipText, sortMenuOpen && styles.sortChipTextOpen]}>{SORT_LABEL[sortKey]} ▾</Text>
            </TouchableOpacity>
          </View>
          {sortMenuOpen && (
            <View style={styles.sortMenu}>
              {SORT_ORDER.map((key) => {
                const cur = key === sortKey;
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.sortMenuItem}
                    onPress={() => {
                      changeSort(key);
                      setSortMenuOpen(false);
                    }}
                  >
                    <Text style={[styles.sortMenuText, cur && styles.sortMenuTextCur]}>{SORT_LABEL[key]}</Text>
                    {cur && <Text style={styles.sortMenuCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {status === 'truncated' && (
        <Text style={styles.truncateNote}>結果が多いため上位200件を表示しています。キーワードを足すと絞り込めます</Text>
      )}

      {/* 外側タップで並び替えメニューを閉じる */}
      {sortMenuOpen && <Pressable style={styles.sortBackdrop} onPress={() => setSortMenuOpen(false)} />}

      {/* 結果エリア（検索前＋4状態） */}
      <View style={styles.results}>
        {status === 'idle' && (
          <View style={styles.idleBox}>
            <Text style={styles.idleIcon}>🎵</Text>
            <Text style={styles.idleText}>{'歌いたい曲を検索して\n持ち歌に追加しましょう'}</Text>
          </View>
        )}

        {status === 'loading' && (
          <View style={styles.centerBox}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {status === 'empty' && (
          <StateBox
            icon="🔎"
            title="見つかりませんでした"
            text={'アーティストやキーワードでも\n探してみてください'}
            actions={[{ label: '✏️ 手入力で登録', kind: 'ghost', onPress: onManual }]}
          />
        )}

        {status === 'error' && (
          <StateBox
            icon="📡"
            title="通信できませんでした"
            text={'電波の良い場所で再試行するか、\n手入力で登録してください'}
            actions={[
              { label: '再試行', kind: 'primary', onPress: retry },
              { label: '✏️ 手入力で登録', kind: 'ghost', onPress: onManual },
            ]}
          />
        )}

        {(status === 'complete' || status === 'truncated') && (
          <SearchResultList
            items={visibleItems}
            toRow={(c) => ({
              key: String(c.trackId),
              title: c.title,
              artist: c.artist,
              artworkUrl: c.artworkUrl,
              meta: c.releaseDate ? c.releaseDate.slice(0, 4) : null,
            })}
            onSelect={handleSelect}
            ListFooterComponent={
              <View style={{ paddingBottom: bottomInset + 12 }}>
                {hasMore && (
                  <TouchableOpacity style={styles.moreBtn} onPress={showMore} accessibilityRole="button">
                    <Text style={styles.moreBtnText}>もっと見る</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.manualLink} onPress={onManual} accessibilityRole="button">
                  <Text style={styles.manualLinkText}>見つからない場合は手入力で登録</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
});

function StateBox({
  icon,
  title,
  text,
  actions,
}: {
  icon: string;
  title: string;
  text: string;
  actions: { label: string; kind: 'primary' | 'ghost'; onPress: () => void }[];
}) {
  return (
    <>
      <View style={styles.stateBox}>
        <Text style={styles.stateIcon}>{icon}</Text>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateText}>{text}</Text>
      </View>
      {actions.length > 0 && (
        <View style={styles.stateActions}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={a.kind === 'primary' ? styles.btnPrimary : styles.btnGhost}
              onPress={a.onPress}
              accessibilityRole="button"
            >
              <Text style={a.kind === 'primary' ? styles.btnPrimaryText : styles.btnGhostText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.text,
  },
  manualPill: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  manualPillText: { fontSize: 11, fontWeight: '700', color: colors.accent },

  // 検索欄（フォームの fieldInput と同じ surface 塗り＋細ボーダー）
  sInput: {
    marginHorizontal: 18,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sIcon: { fontSize: 13 },
  sField: { flex: 1, fontSize: 13, color: colors.text, padding: 0 },
  sClear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sClearText: { color: colors.white, fontSize: 10 },

  // モード切り替え
  modeSeg: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: 18,
    marginBottom: 10,
    backgroundColor: colors.surface2,
    padding: 3,
    borderRadius: 11,
  },
  modeItem: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  modeItemOn: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  modeText: { fontSize: 11, fontWeight: '600', color: colors.text2 },
  modeTextOn: { color: colors.accent },

  // 件数・並び替え
  metaWrap: { marginHorizontal: 18, marginBottom: 6, position: 'relative', zIndex: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: 11, color: colors.text2 },
  metaCount: { color: colors.text, fontWeight: '500' },
  sortChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.white,
  },
  sortChipOpen: { borderColor: 'rgba(91,76,245,0.35)' },
  sortChipText: { fontSize: 11, color: colors.text },
  sortChipTextOpen: { color: colors.accent },
  sortMenu: {
    position: 'absolute',
    right: 0,
    top: 30,
    width: 180,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  sortMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortMenuText: { fontSize: 12, color: colors.text },
  sortMenuTextCur: { color: colors.accent, fontWeight: '700' },
  sortMenuCheck: { fontSize: 12, color: colors.accent, fontWeight: '700' },
  sortBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },

  // 履歴ドロップダウンのアンカー。通常レイアウトに差し込み、下のコンテンツを押し下げる
  historyDropdownAnchor: {
    marginHorizontal: 18,
    marginBottom: 8,
  },

  truncateNote: {
    marginHorizontal: 18,
    marginBottom: 8,
    fontSize: 10,
    color: colors.yellow,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  // 結果エリア
  results: { flex: 1, paddingHorizontal: 18 },
  centerBox: { paddingTop: 40, alignItems: 'center' },
  idleBox: { paddingTop: 48, alignItems: 'center', gap: 10 },
  idleIcon: { fontSize: 30, opacity: 0.6 },
  idleText: { fontSize: 12, color: colors.text3, lineHeight: 19, textAlign: 'center' },

  // 状態表示
  stateBox: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: 14,
  },
  stateIcon: { fontSize: 26, marginBottom: 8 },
  stateTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  stateText: { fontSize: 11, color: colors.text2, lineHeight: 18, textAlign: 'center' },
  stateActions: { marginTop: 14, gap: 8 },
  btnPrimary: { paddingVertical: 11, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center' },
  btnPrimaryText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  btnGhost: {
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(91,76,245,0.3)',
    alignItems: 'center',
  },
  btnGhostText: { color: colors.accent, fontSize: 12, fontWeight: '600' },

  // もっと見る・手入力導線
  moreBtn: {
    marginTop: 10,
    marginBottom: 6,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    alignItems: 'center',
  },
  moreBtnText: { fontSize: 11, fontWeight: '600', color: colors.text },
  manualLink: {
    marginTop: 6,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(91,76,245,0.3)',
    borderRadius: 10,
    alignItems: 'center',
  },
  manualLinkText: { fontSize: 11, color: colors.accent },
});
