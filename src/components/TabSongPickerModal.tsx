import { useEffect, useMemo, useState } from 'react';
import {
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
import { SongWithStats } from '../types';
import { normalizeForSearch } from '../lib/text';

type SortKey = 'created_at' | 'title' | 'artist';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created_at', label: '登録日' },
  { key: 'title', label: '曲名' },
  { key: 'artist', label: 'アーティスト' },
];

const jaCollator = new Intl.Collator('ja');

interface Props {
  visible: boolean;
  tabName: string;
  songs: SongWithStats[];
  selectedIds: number[];
  onSave: (ids: number[]) => void;
  onClose: () => void;
}

/** タブ起点で所属曲を一括編集するモーダル（#117）。検索・並べ替え・チェックボックス。 */
export function TabSongPickerModal({ visible, tabName, songs, selectedIds, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState<Set<number>>(new Set(selectedIds));
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // 開くたびに選択状態・検索・並びを最新へ同期する
  useEffect(() => {
    if (visible) {
      setChecked(new Set(selectedIds));
      setQuery('');
      setSortKey('created_at');
      setSortMenuOpen(false);
    }
  }, [visible, selectedIds]);

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleSongs = useMemo(() => {
    const q = normalizeForSearch(query);
    const base = q
      ? songs.filter((s) => {
          const fields = [s.title, s.artist, s.title_reading, s.artist_reading].map(normalizeForSearch);
          return fields.some((f) => f.includes(q));
        })
      : songs;
    const sorted = [...base];
    if (sortKey === 'title') {
      sorted.sort((a, b) => jaCollator.compare(
        normalizeForSearch(a.title_reading || a.title),
        normalizeForSearch(b.title_reading || b.title),
      ));
    } else if (sortKey === 'artist') {
      sorted.sort((a, b) => jaCollator.compare(
        normalizeForSearch(a.artist_reading || a.artist),
        normalizeForSearch(b.artist_reading || b.artist),
      ));
    } else {
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return sorted;
  }, [songs, query, sortKey]);

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? '';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>対応曲を変更</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{tabName} ・ {checked.size}曲選択中</Text>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={() => { onSave(Array.from(checked)); }}>
            <Text style={styles.saveText}>設定</Text>
          </TouchableOpacity>
        </View>

        {/* 検索 + 並べ替え */}
        <View style={styles.toolRow}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="曲名・アーティスト名で検索"
              placeholderTextColor={colors.text3}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <View style={styles.searchClear}><Text style={styles.searchClearText}>✕</Text></View>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.sortChip, sortMenuOpen && styles.sortChipOpen]}
            onPress={() => setSortMenuOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="並べ替え"
          >
            <Text style={[styles.sortChipText, sortMenuOpen && styles.sortChipTextOpen]}>{sortLabel} ▾</Text>
          </TouchableOpacity>
        </View>

        {/* 曲リスト */}
        <FlatList
          data={visibleSongs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isChecked = checked.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.row, isChecked && styles.rowChecked]}
                onPress={() => toggle(item.id)}
                activeOpacity={0.7}
              >
                {item.artwork_url ? (
                  <Image source={{ uri: item.artwork_url }} style={styles.art} />
                ) : (
                  <View style={[styles.art, styles.artFallback]}><Text style={styles.artEmoji}>🎵</Text></View>
                )}
                <View style={styles.info}>
                  <Text style={[styles.songTitle, isChecked && styles.songTitleChecked]} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.artist} numberOfLines={1}>{item.artist || '—'}</Text>
                </View>
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* 下部固定ボタン */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.footerBtn} onPress={() => onSave(Array.from(checked))}>
            <Text style={styles.footerBtnText}>設定する（{checked.size}曲）</Text>
          </TouchableOpacity>
        </View>

        {/* 並べ替えメニュー */}
        {sortMenuOpen && (
          <View style={styles.sortMenu}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.sortMenuItem}
                onPress={() => { setSortKey(opt.key); setSortMenuOpen(false); }}
              >
                <Text style={[styles.sortMenuText, sortKey === opt.key && styles.sortMenuTextCur]}>{opt.label}</Text>
                {sortKey === opt.key && <Text style={styles.sortMenuCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  cancelBtn: { minWidth: 64 },
  cancelText: { fontSize: 14, color: colors.text2 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontFamily: fonts.jakartaBold, fontSize: 15, color: colors.text },
  subtitle: { fontSize: 11, color: colors.text3, marginTop: 1 },
  saveBtn: { minWidth: 64, alignItems: 'flex-end' },
  saveText: { fontSize: 14, color: colors.accent, fontWeight: '700' },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
  },
  searchIcon: { fontSize: 12 },
  searchInput: { flex: 1, fontSize: 12, color: colors.text },
  searchClear: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: colors.text3,
    alignItems: 'center', justifyContent: 'center',
  },
  searchClearText: { color: colors.white, fontSize: 10 },
  sortChip: {
    height: 38, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  sortChipOpen: { borderColor: 'rgba(91, 76, 245, 0.4)' },
  sortChipText: { fontSize: 11, color: colors.text, fontWeight: '600' },
  sortChipTextOpen: { color: colors.accent },
  list: { paddingHorizontal: 12, gap: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 12, borderWidth: 1.5,
    borderColor: colors.border, padding: 10,
  },
  rowChecked: { borderColor: 'rgba(91, 76, 245, 0.3)', backgroundColor: colors.accentSoft },
  art: { width: 40, height: 40, borderRadius: 8 },
  artFallback: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  artEmoji: { fontSize: 18 },
  info: { flex: 1 },
  songTitle: { fontSize: 13, fontWeight: '500', color: colors.text },
  songTitleChecked: { color: colors.accent },
  artist: { fontSize: 11, color: colors.text3, marginTop: 2 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { fontSize: 12, color: colors.white, fontWeight: '700' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.97)', borderTopWidth: 1, borderTopColor: colors.border,
  },
  footerBtn: {
    backgroundColor: colors.accent, borderRadius: 13, paddingVertical: 14, alignItems: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 4,
  },
  footerBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  sortMenu: {
    position: 'absolute', right: 12, top: 62, width: 160, backgroundColor: colors.white,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 30, elevation: 10,
    overflow: 'hidden',
  },
  sortMenuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sortMenuText: { fontSize: 12, color: colors.text },
  sortMenuTextCur: { color: colors.accent, fontWeight: '700' },
  sortMenuCheck: { fontSize: 12, color: colors.accent },
});
