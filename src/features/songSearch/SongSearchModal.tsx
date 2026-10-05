// 曲検索モーダル（04a 選択画面 ＋ 04b 検索画面）。spec-1.1.0-song-flow §5・§6.6。
// ワイヤーフレーム v6 セクションC を基準にスタイリング。

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchResultList } from '../../components/SearchResultList';
import { colors } from '../../constants/colors';
import { buildInitialQuery } from './logic';
import { SearchMode, SongCandidate, SortKey } from './types';
import { useSongSearch } from './useSongSearch';

type Props = {
  visible: boolean;
  purpose: 'add' | 'change'; // add=手入力あり / change=手入力なし
  currentSong?: { title: string; artist: string }; // change のときの初期入力用
  onSelect: (candidate: SongCandidate) => void;
  onManual?: () => void; // add のときのみ
  onClose: () => void;
};

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

export function SongSearchModal({ visible, purpose, currentSong, onSelect, onManual, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<'select' | 'search'>('select');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const search = useSongSearch();

  // モーダルを開くたびに 04a（選択画面）へリセット（§5.7）
  useEffect(() => {
    if (visible) {
      setScreen('select');
      setSortMenuOpen(false);
    }
  }, [visible]);

  function openSearch(mode: SearchMode) {
    const initial =
      purpose === 'change' && currentSong
        ? buildInitialQuery(mode, currentSong.title, currentSong.artist)
        : '';
    search.reset(mode, initial);
    setScreen('search');
  }

  // 戻る操作：04b→04a、04a→閉じる（§5.11）
  function handleBack() {
    if (sortMenuOpen) {
      setSortMenuOpen(false);
      return;
    }
    if (screen === 'search') setScreen('select');
    else onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleBack}>
      <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
        {screen === 'select' ? (
          <SelectScreen
            purpose={purpose}
            currentSong={currentSong}
            onPickMode={openSearch}
            onManual={onManual}
            onClose={onClose}
          />
        ) : (
          <SearchScreen
            purpose={purpose}
            search={search}
            sortMenuOpen={sortMenuOpen}
            setSortMenuOpen={setSortMenuOpen}
            onBack={() => setScreen('select')}
            onSelect={onSelect}
            onManual={onManual}
            bottomInset={insets.bottom}
          />
        )}
      </View>
    </Modal>
  );
}

// ---- 04a 選択画面 ----
function SelectScreen({
  purpose,
  currentSong,
  onPickMode,
  onManual,
  onClose,
}: {
  purpose: 'add' | 'change';
  currentSong?: { title: string; artist: string };
  onPickMode: (mode: SearchMode) => void;
  onManual?: () => void;
  onClose: () => void;
}) {
  const title = currentSong?.title ?? '';
  const artist = currentSong?.artist ?? '';
  const descFor = (mode: SearchMode): string => {
    if (purpose !== 'change') {
      return mode === 'song' ? '曲名で検索' : mode === 'artist' ? '歌手名で検索' : '曲名・歌手名・アルバム名から検索';
    }
    if (mode === 'song') return `曲名「${title}」で検索`;
    if (mode === 'artist') return `「${artist}」で検索`;
    return `「${`${title} ${artist}`.trim()}」で検索`;
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="閉じる">
          <Text style={styles.headerClose}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{purpose === 'change' ? '曲を変更' : '曲を追加'}</Text>
      </View>

      <View style={styles.choiceList}>
        <ChoiceButton icon="🎵" name="曲から探す" desc={descFor('song')} first onPress={() => onPickMode('song')} />
        <ChoiceButton icon="🎤" name="アーティストから探す" desc={descFor('artist')} onPress={() => onPickMode('artist')} />
        <ChoiceButton icon="🔍" name="キーワードで探す" desc={descFor('keyword')} onPress={() => onPickMode('keyword')} />
        {purpose === 'add' && onManual && (
          <ChoiceButton icon="✏️" name="手入力で登録" desc="検索で見つからない曲・オフライン時" manual onPress={onManual} />
        )}
      </View>

      <Text style={styles.choiceHint}>
        {purpose === 'change'
          ? '手入力で直したい場合は、編集画面の曲名・アーティスト名を書き換えてください。'
          : '押したボタンが検索画面の最初のモードになります。'}
      </Text>
    </>
  );
}

function ChoiceButton({
  icon,
  name,
  desc,
  first,
  manual,
  onPress,
}: {
  icon: string;
  name: string;
  desc: string;
  first?: boolean;
  manual?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.choice, first && styles.choiceFirst, manual && styles.choiceManual]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <View style={[styles.choiceIcon, manual && styles.choiceIconManual]}>
        <Text style={styles.choiceIconText}>{icon}</Text>
      </View>
      <View style={styles.choiceBody}>
        <Text style={styles.choiceName}>{name}</Text>
        <Text style={styles.choiceDesc}>{desc}</Text>
      </View>
      <Text style={styles.choiceArrow}>›</Text>
    </TouchableOpacity>
  );
}

// ---- 04b 検索画面 ----
function SearchScreen({
  purpose,
  search,
  sortMenuOpen,
  setSortMenuOpen,
  onBack,
  onSelect,
  onManual,
  bottomInset,
}: {
  purpose: 'add' | 'change';
  search: ReturnType<typeof useSongSearch>;
  sortMenuOpen: boolean;
  setSortMenuOpen: (open: boolean) => void;
  onBack: () => void;
  onSelect: (candidate: SongCandidate) => void;
  onManual?: () => void;
  bottomInset: number;
}) {
  const { query, setQuery, mode, setMode, sortKey, changeSort, status, visibleItems, totalCount, hasMore, showMore, retry } = search;
  const showSortRow = status === 'complete' || status === 'truncated';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="戻る">
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{purpose === 'change' ? '曲を変更' : '曲を追加'}</Text>
      </View>

      {/* 検索欄 */}
      <View style={styles.sInput}>
        <Text style={styles.sIcon}>🔍</Text>
        <TextInput
          style={styles.sField}
          value={query}
          onChangeText={setQuery}
          placeholder={MODE_PLACEHOLDER[mode]}
          placeholderTextColor={colors.text3}
          autoFocus
          returnKeyType="search"
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

      {/* 結果エリア（4状態） */}
      <View style={styles.results}>
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
            actions={purpose === 'add' && onManual ? [{ label: '✏️ 手入力で登録', kind: 'ghost' as const, onPress: onManual }] : []}
          />
        )}

        {status === 'error' && (
          <StateBox
            icon="📡"
            title="通信できませんでした"
            text={'電波の良い場所で再試行するか、\n手入力で登録してください'}
            actions={[
              { label: '再試行', kind: 'primary' as const, onPress: retry },
              ...(purpose === 'add' && onManual ? [{ label: '✏️ 手入力で登録', kind: 'ghost' as const, onPress: onManual }] : []),
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
            onSelect={onSelect}
            ListFooterComponent={
              <View style={{ paddingBottom: bottomInset + 12 }}>
                {hasMore && (
                  <TouchableOpacity style={styles.moreBtn} onPress={showMore} accessibilityRole="button">
                    <Text style={styles.moreBtnText}>もっと見る</Text>
                  </TouchableOpacity>
                )}
                {purpose === 'add' && onManual && (
                  <TouchableOpacity style={styles.manualLink} onPress={onManual} accessibilityRole="button">
                    <Text style={styles.manualLinkText}>見つからない場合は手入力で登録</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

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
  // 登録フォーム（new.tsx）と同じ白地に揃える
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  headerClose: { fontSize: 18, color: colors.text2 },
  headerBack: { fontSize: 26, color: colors.text2, lineHeight: 26 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },

  // 04a
  choiceList: { paddingHorizontal: 18, paddingTop: 4, gap: 10 },
  // フォームのフィールドと同じ塗りカード（surface＋細ボーダー、影なし）
  choice: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 11,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceFirst: { borderColor: 'rgba(91,76,245,0.35)' },
  choiceManual: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  choiceIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconManual: { backgroundColor: colors.surface2 },
  choiceIconText: { fontSize: 17 },
  choiceBody: { flex: 1 },
  choiceName: { fontSize: 14, fontWeight: '600', color: colors.text },
  choiceDesc: { fontSize: 10, color: colors.text2, marginTop: 2 },
  choiceArrow: { fontSize: 18, color: colors.text3 },
  choiceHint: { marginHorizontal: 18, marginTop: 14, fontSize: 10, color: colors.text3, lineHeight: 16 },

  // 04b 検索欄（フォームの fieldInput と同じ surface 塗り＋細ボーダー）
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

  // 状態表示
  stateBox: {
    marginHorizontal: 18,
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
  stateActions: { marginHorizontal: 18, marginTop: 14, gap: 8 },
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
