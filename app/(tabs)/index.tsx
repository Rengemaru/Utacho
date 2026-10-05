import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoachMark } from '../../src/components/CoachMark';
import { EmptyState } from '../../src/components/EmptyState';
import { FirstLaunchGuide } from '../../src/components/FirstLaunchGuide';
import { RandomPickModal } from '../../src/components/RandomPickModal';
import { ScoreBottomSheet } from '../../src/components/ScoreBottomSheet';
import { SetlistModal } from '../../src/components/SetlistModal';
import { SongCard } from '../../src/components/SongCard';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { deleteSong, getAllSongs, getRandomSongId } from '../../src/db/songs';
import { getSessionSummary, getMonthlyStats, SessionSummary, MonthlyStats } from '../../src/db/scores';
import { getSetlistSongIds, saveSetlistSongIds, getSettingSync, setSettingSync } from '../../src/db/settings';
import { useSongs, ALL_TAB, SETLIST_TAB } from '../../src/hooks/useSongs';
import { useTabs } from '../../src/hooks/useTabs';
import { SearchMatchMode, SongWithStats } from '../../src/types';
import { normalizeForSearch } from '../../src/lib/text';

// ローカル持ち歌検索の照合モードを保存する settings キー
const SEARCH_MATCH_MODE_KEY = 'search_match_mode';

type SortKey = 'created_at' | 'best_score' | 'score_count' | 'latest_scored_at' | 'improvement';

import { truncateTabName } from '../../src/constants/tabConfig';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created_at',      label: '登録日（新しい順）' },
  { key: 'best_score',      label: '最高スコア順' },
  { key: 'score_count',     label: '記録回数順' },
  { key: 'latest_scored_at', label: '最終記録日（古い順）' },
  { key: 'improvement',     label: 'スコア伸び率順' },
];

function sortSongs(songs: SongWithStats[], key: SortKey): SongWithStats[] {
  if (key === 'created_at') return songs;
  return [...songs].sort((a, b) => {
    switch (key) {
      case 'best_score':
        return (b.best_score ?? -1) - (a.best_score ?? -1);
      case 'score_count':
        return b.score_count - a.score_count;
      case 'latest_scored_at': {
        if (!a.latest_scored_at && !b.latest_scored_at) return 0;
        if (!a.latest_scored_at) return 1;
        if (!b.latest_scored_at) return -1;
        return a.latest_scored_at.localeCompare(b.latest_scored_at);
      }
      case 'improvement': {
        const ai = a.latest_score != null && a.first_score != null ? a.latest_score - a.first_score : -999;
        const bi = b.latest_score != null && b.first_score != null ? b.latest_score - b.first_score : -999;
        return bi - ai;
      }
    }
  });
}

function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { tabsWithAll, reload: reloadTabs } = useTabs();
  const [activeTabId, setActiveTabId] = useState<number>(ALL_TAB.id);
  const [query, setQuery] = useState('');
  // 前方/部分一致の切替。settings から初期値を読む（既定は現行挙動の部分一致）
  const [matchMode, setMatchMode] = useState<SearchMatchMode>(() => {
    try {
      return getSettingSync(SEARCH_MATCH_MODE_KEY) === 'prefix' ? 'prefix' : 'partial';
    } catch {
      return 'partial';
    }
  });
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [setlistIds, setSetlistIds] = useState<number[]>([]);
  const [setlistModalVisible, setSetlistModalVisible] = useState(false);
  const [allSongsForSetlist, setAllSongsForSetlist] = useState<SongWithStats[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [firstLaunchGuideVisible, setFirstLaunchGuideVisible] = useState(false);
  const [coachMarkVisible, setCoachMarkVisible] = useState(false);
  const [randomModalVisible, setRandomModalVisible] = useState(false);

  const { songs, loading, error, reload } = useSongs(activeTabId);

  const swipeRefs = useRef<Map<number, Swipeable | null>>(new Map());
  const [scoringSong, setScoringsSong] = useState<SongWithStats | null>(null);
  // Bug-5: reloadExtras のクロージャが古い activeTabId を参照しないよう ref で管理
  const activeTabIdRef = useRef(activeTabId);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

  function reloadExtras() {
    if (Platform.OS === 'web') return;
    try {
      const today = localDateString();
      const ids = getSetlistSongIds(today);
      setSetlistIds(ids);

      // Bug-5: セットリストが空になったのに SETLIST_TAB が選択中の場合は ALL_TAB に戻す
      if (ids.length === 0 && activeTabIdRef.current === SETLIST_TAB.id) {
        setActiveTabId(ALL_TAB.id);
      }

      const summary = getSessionSummary(today);
      setSessionSummary(summary.song_count > 0 ? summary : null);

      const monthly = getMonthlyStats(currentYearMonth());
      setMonthlyStats(monthly.record_count > 0 ? monthly : null);
    } catch (e) {
      console.error(e);
    }
  }

  useFocusEffect(
    useCallback(() => {
      reloadTabs();
      reload();
      reloadExtras();
      // Onb-1/2: 初回ガイドとコーチマークは排他制御（同時表示しない）
      if (Platform.OS !== 'web') {
        const flag = getSettingSync('first_launch_guide');
        if (flag === 'pending') {
          setFirstLaunchGuideVisible(true);
        } else {
          // Onb-2: ガイドが出ないときのみコーチマークを確認
          const coachShown = getSettingSync('coach_mark_shown');
          if (coachShown !== 'true') setCoachMarkVisible(true);
        }
      }
    }, [reloadTabs, reload])
  );

  function handleFirstLaunchRegister() {
    setSettingSync('first_launch_guide', 'done');
    // 「今すぐ登録」を選んだユーザーはコーチマーク不要（ガイドで十分）
    setSettingSync('coach_mark_shown', 'true');
    setFirstLaunchGuideVisible(false);
    router.push('/song/new');
  }

  function handleFirstLaunchLater() {
    setSettingSync('first_launch_guide', 'done');
    setFirstLaunchGuideVisible(false);
    // 「あとで」の場合のみコーチマークを表示
    const coachShown = getSettingSync('coach_mark_shown');
    if (coachShown !== 'true') setCoachMarkVisible(true);
  }

  function handleCoachMarkDismiss() {
    setSettingSync('coach_mark_shown', 'true');
    setCoachMarkVisible(false);
  }

  function handleRandomPick(scopeId: number) {
    setRandomModalVisible(false);
    if (Platform.OS === 'web') return;
    // ALL_TAB（すべて）は全曲から、それ以外はそのタブから抽選
    const tabId = scopeId === ALL_TAB.id ? null : scopeId;
    const songId = getRandomSongId(tabId);
    if (songId != null) {
      router.push(`/song/${songId}`);
    }
  }

  function openSetlistModal() {
    if (Platform.OS !== 'web') {
      setAllSongsForSetlist(getAllSongs());
    }
    setSetlistModalVisible(true);
  }

  function handleSaveSetlist(ids: number[]) {
    saveSetlistSongIds(localDateString(), ids);
    setSetlistIds(ids);
    reloadTabs();
    if (activeTabId === SETLIST_TAB.id && ids.length === 0) {
      setActiveTabId(ALL_TAB.id);
    }
    reload();
  }

  function closeOtherSwipeables(currentId: number) {
    swipeRefs.current.forEach((ref, id) => {
      if (id !== currentId) ref?.close();
    });
  }

  function handleDeleteSong(song: SongWithStats) {
    Alert.alert(
      '曲を削除',
      `「${song.title}」を削除しますか？\nスコア履歴もすべて削除されます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'web') { reload(); return; }
            try {
              deleteSong(song.id);
              reload();
              reloadTabs();
              reloadExtras();
            } catch (e) {
              console.error(e);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  }

  function toggleMatchMode() {
    const next: SearchMatchMode = matchMode === 'partial' ? 'prefix' : 'partial';
    setMatchMode(next);
    try {
      setSettingSync(SEARCH_MATCH_MODE_KEY, next);
    } catch {
      // web など DB 未初期化環境では保存をスキップ（状態のみ切替）
    }
  }

  const filtered = useMemo(() => {
    // 入力・対象の両側をかな正規化し、4フィールド（曲名/アーティスト/各読み）で照合する
    const q = normalizeForSearch(query);
    const base = q
      ? songs.filter((s) => {
          const fields = [s.title, s.artist, s.title_reading, s.artist_reading].map(normalizeForSearch);
          return matchMode === 'prefix'
            ? fields.some((f) => f.startsWith(q))
            : fields.some((f) => f.includes(q));
        })
      : songs;
    return sortSongs(base, sortKey);
  }, [songs, query, matchMode, sortKey]);

  // セットリストタブを先頭に追加（今日の分が存在する場合）
  const visibleTabs = useMemo(() => {
    if (setlistIds.length > 0) {
      return [
        { ...SETLIST_TAB, song_count: setlistIds.length },
        ...tabsWithAll,
      ];
    }
    return tabsWithAll;
  }, [tabsWithAll, setlistIds]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? '';
  // 登録曲が1件もないときはランダム選曲ボタンを出さない
  const hasAnySong = (tabsWithAll.find((t) => t.id === ALL_TAB.id)?.song_count ?? 0) > 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>歌帳</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.setlistBtn}
            onPress={openSetlistModal}
            accessibilityLabel="今日のセットリスト"
          >
            <Text style={styles.setlistBtnText}>📋</Text>
            {setlistIds.length > 0 && (
              <View style={styles.setlistBadge}>
                <Text style={styles.setlistBadgeText}>{setlistIds.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => router.push('/help')}
            accessibilityLabel="ヘルプ"
          >
            <Text style={styles.helpBtnText}>？</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/song/new')}
          >
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* セッションサマリーバナー */}
      {sessionSummary && (
        <View style={styles.sessionBanner}>
          <Text style={styles.sessionBannerText}>🎤 今日の記録</Text>
          <View style={styles.sessionBannerStats}>
            <Text style={styles.sessionBannerNum}>{sessionSummary.song_count}</Text>
            <Text style={styles.sessionBannerLabel}>曲</Text>
          </View>
          {sessionSummary.pb_count > 0 && (
            <>
              <Text style={styles.sessionBannerSep}>／</Text>
              <Text style={styles.sessionBannerPbIcon}>🎉</Text>
              <View style={styles.sessionBannerStats}>
                <Text style={styles.sessionBannerNum}>{sessionSummary.pb_count}</Text>
                <Text style={styles.sessionBannerLabel}>曲ベスト更新</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Onb-2: コアループのコーチマーク（初回のみ） */}
      <CoachMark visible={coachMarkVisible} onDismiss={handleCoachMarkDismiss} />

      {/* 月次統計バー */}
      {monthlyStats && (
        <View style={styles.monthlyBar}>
          <Text style={styles.monthlyText}>
            📅 今月 {monthlyStats.record_count}回記録
            {monthlyStats.pb_count > 0 ? ` · ベスト更新${monthlyStats.pb_count}曲` : ''}
          </Text>
        </View>
      )}

      {/* タブ横スクロール */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          const isSetlist = tab.id === SETLIST_TAB.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabPill,
                isActive && styles.tabPillActive,
                isSetlist && styles.tabPillSetlist,
                isActive && isSetlist && styles.tabPillSetlistActive,
              ]}
              onPress={() => setActiveTabId(tab.id)}
            >
              <Text style={[
                styles.tabPillText,
                isActive && styles.tabPillTextActive,
                isSetlist && styles.tabPillTextSetlist,
              ]}>
                {isSetlist ? '📋 ' : ''}{truncateTabName(tab.name)}
              </Text>
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive, isSetlist && styles.tabBadgeSetlist]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                  {tab.song_count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 検索バー + ソートボタン */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="曲名・アーティスト名で検索"
            placeholderTextColor={colors.text3}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.matchBtn, matchMode === 'prefix' && styles.matchBtnActive]}
          onPress={toggleMatchMode}
          accessibilityRole="button"
          accessibilityLabel={`検索の一致方式：現在は${matchMode === 'prefix' ? '前方一致' : '部分一致'}。タップで切替`}
        >
          <Text style={[styles.matchBtnText, matchMode === 'prefix' && styles.matchBtnTextActive]}>
            {matchMode === 'prefix' ? '前方' : '部分'}
          </Text>
        </TouchableOpacity>
        {hasAnySong && (
          <TouchableOpacity
            style={styles.diceBtn}
            onPress={() => setRandomModalVisible(true)}
            accessibilityLabel="ランダムに選曲"
          >
            <Text style={styles.diceBtnText}>🎲</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.sortBtn, sortKey !== 'created_at' && styles.sortBtnActive]}
          onPress={() => setSortModalVisible(true)}
        >
          <Text style={[styles.sortBtnText, sortKey !== 'created_at' && styles.sortBtnTextActive]}>⇅</Text>
        </TouchableOpacity>
      </View>

      {/* ソートラベル（デフォルト以外の時のみ） */}
      {sortKey !== 'created_at' && (
        <Text style={styles.sortLabel}>{currentSortLabel}</Text>
      )}

      {/* 曲一覧 */}
      {error ? (
        <View style={styles.center}>
          <EmptyState emoji="⚠️" title="データを取得できませんでした" subtitle={error} />
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <EmptyState emoji="⏳" title="読み込み中..." />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            emoji="🎵"
            title={query ? '検索結果がありません' : 'まだ曲がありません'}
            subtitle={query ? '別のキーワードで試してみてください' : 'カラオケで歌った曲を追加しましょう'}
            actionLabel={query ? undefined : '＋ 最初の曲を追加する'}
            onAction={query ? undefined : () => router.push('/song/new')}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Swipeable
              ref={(ref) => { swipeRefs.current.set(item.id, ref); }}
              onSwipeableWillOpen={() => closeOtherSwipeables(item.id)}
              overshootRight={false}
              renderRightActions={() => (
                <View style={styles.swipeActions}>
                  <TouchableOpacity
                    style={[styles.swipeBtn, styles.swipeEditBtn]}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}を編集`}
                    onPress={() => {
                      swipeRefs.current.get(item.id)?.close();
                      router.push(`/song/new?songId=${item.id}`);
                    }}
                  >
                    <Text style={styles.swipeBtnText}>✏️{'\n'}編集</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.swipeBtn, styles.swipeDeleteBtn]}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}を削除`}
                    onPress={() => {
                      swipeRefs.current.get(item.id)?.close();
                      handleDeleteSong(item);
                    }}
                  >
                    <Text style={styles.swipeBtnText}>🗑{'\n'}削除</Text>
                  </TouchableOpacity>
                </View>
              )}
            >
              <TouchableOpacity onPress={() => router.push(`/song/${item.id}`)}>
                <SongCard
                  song={item}
                  onPressRecord={() => setScoringsSong(item)}
                />
              </TouchableOpacity>
            </Swipeable>
          )}
        />
      )}

      {scoringSong && (
        <ScoreBottomSheet
          visible={!!scoringSong}
          song={scoringSong}
          editingScore={null}
          onClose={() => setScoringsSong(null)}
          onSaved={() => {
            setScoringsSong(null);
            reload();
            reloadExtras();
          }}
        />
      )}

      {/* ソート選択モーダル */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.sortOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.sortSheet}>
            <Text style={styles.sortSheetTitle}>並び替え</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortOption, sortKey === opt.key && styles.sortOptionActive]}
                onPress={() => { setSortKey(opt.key); setSortModalVisible(false); }}
              >
                <Text style={[styles.sortOptionText, sortKey === opt.key && styles.sortOptionTextActive]}>
                  {opt.label}
                </Text>
                {sortKey === opt.key && <Text style={styles.sortOptionCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* セットリスト選択モーダル */}
      <SetlistModal
        visible={setlistModalVisible}
        songs={allSongsForSetlist}
        selectedIds={setlistIds}
        onSave={handleSaveSetlist}
        onClose={() => setSetlistModalVisible(false)}
      />

      {/* Onb-1: 初回起動ガイド */}
      <FirstLaunchGuide
        visible={firstLaunchGuideVisible}
        onRegister={handleFirstLaunchRegister}
        onLater={handleFirstLaunchLater}
        onRequestClose={handleFirstLaunchLater}
      />

      {/* ランダム選曲モーダル */}
      <RandomPickModal
        visible={randomModalVisible}
        scopes={tabsWithAll}
        onPick={handleRandomPick}
        onClose={() => setRandomModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    paddingBottom: 10,
  },
  appTitle: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setlistBtn: {
    width: 34,
    height: 34,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  setlistBtnText: { fontSize: 16, lineHeight: 20 },
  setlistBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  setlistBadgeText: { fontSize: 9, color: colors.white, fontWeight: '700' },
  helpBtn: {
    width: 34,
    height: 34,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  helpBtnText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '700',
    lineHeight: 20,
  },
  addBtn: {
    width: 34,
    height: 34,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  addBtnText: { fontSize: 20, color: colors.white, lineHeight: 24 },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 18,
    marginBottom: 8,
    backgroundColor: colors.accentSoft,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sessionBannerText: { fontSize: 11, color: colors.accent, fontWeight: '600', marginRight: 4 },
  sessionBannerStats: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  sessionBannerNum: { fontFamily: 'DMMono_500Medium', fontSize: 14, color: colors.accent, fontWeight: '700' },
  sessionBannerLabel: { fontSize: 10, color: colors.accent },
  sessionBannerSep: { fontSize: 10, color: colors.text3, marginHorizontal: 2 },
  sessionBannerPbIcon: { fontSize: 12 },
  monthlyBar: {
    marginHorizontal: 18,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthlyText: { fontSize: 11, color: colors.text2 },
  // flexShrink:0 が必須。これが無いと、曲が増えて FlatList が縦に伸びたとき
  // flex shrink でタブ行が圧縮され、pill の下端から切れていく（曲数に比例して悪化）。
  // flexGrow:0 で縦に伸びず、固定 height は与えない（固定すると hard clip 枠になる）。
  tabScroll: { flexGrow: 0, flexShrink: 0, marginBottom: 10 },
  tabScrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    gap: 6,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(91, 76, 245, 0.2)',
  },
  tabPillSetlist: {
    backgroundColor: 'rgba(0, 185, 107, 0.08)',
    borderColor: 'rgba(0, 185, 107, 0.2)',
  },
  tabPillSetlistActive: {
    backgroundColor: 'rgba(0, 185, 107, 0.15)',
    borderColor: 'rgba(0, 185, 107, 0.4)',
  },
  tabPillText: { fontSize: 11, fontWeight: '500', color: colors.text2, lineHeight: 16, includeFontPadding: false },
  tabPillTextActive: { color: colors.accent },
  tabPillTextSetlist: { color: colors.green },
  tabBadge: {
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: 'rgba(91, 76, 245, 0.15)' },
  tabBadgeSetlist: { backgroundColor: 'rgba(0, 185, 107, 0.15)' },
  tabBadgeText: { fontSize: 9, fontWeight: '700', color: colors.text3, lineHeight: 14 },
  tabBadgeTextActive: { color: colors.accent },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 18,
    marginBottom: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchIcon: { fontSize: 12 },
  searchInput: { flex: 1, fontSize: 12, color: colors.text },
  diceBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceBtnText: { fontSize: 16 },
  sortBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortBtnActive: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(91, 76, 245, 0.3)',
  },
  sortBtnText: { fontSize: 16, color: colors.text2 },
  sortBtnTextActive: { color: colors.accent },
  matchBtn: {
    height: 36,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBtnActive: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(91, 76, 245, 0.3)',
  },
  matchBtnText: { fontSize: 12, fontWeight: '600', color: colors.text2 },
  matchBtnTextActive: { color: colors.accent },
  sortLabel: {
    fontSize: 10,
    color: colors.accent,
    marginHorizontal: 18,
    marginBottom: 6,
    fontWeight: '500',
  },
  // flex:1 で残り領域いっぱいに広がり内部スクロールする。これが無いと
  // FlatList が中身の高さで膨らみ、兄弟（タブ行）を flex shrink で圧迫して切る。
  list: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingBottom: 100, gap: 7 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  swipeActions: { flexDirection: 'row', alignItems: 'stretch', paddingLeft: 8, gap: 6 },
  swipeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    minWidth: 64,
    paddingHorizontal: 10,
  },
  swipeEditBtn: { backgroundColor: colors.accent },
  swipeDeleteBtn: { backgroundColor: colors.red, marginRight: 0 },
  swipeBtnText: { color: colors.white, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  sortOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 18,
  },
  sortSheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text2,
    marginBottom: 12,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortOptionActive: {},
  sortOptionText: { fontSize: 14, color: colors.text },
  sortOptionTextActive: { color: colors.accent, fontWeight: '600' },
  sortOptionCheck: { fontSize: 16, color: colors.accent },
});
