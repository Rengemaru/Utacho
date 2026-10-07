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

interface Props {
  visible: boolean;
  songs: SongWithStats[];
  selectedIds: number[];
  onSave: (ids: number[]) => void;
  onClose: () => void;
}

export function SetlistModal({ visible, songs, selectedIds, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState<Set<number>>(new Set(selectedIds));
  const [query, setQuery] = useState('');

  // モーダルが開くたびに選択状態を最新の selectedIds に同期する。
  // onShow はスライドイン完了後に発火するため前回の選択が一瞬残る問題があり、visible 変化で同期する。
  useEffect(() => {
    if (visible) {
      setChecked(new Set(selectedIds));
      setQuery('');
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

  const filtered = useMemo(() => {
    // ホーム検索と同じく、かな正規化＋4フィールド（曲名/アーティスト/各読み）で部分一致（#79）
    const q = normalizeForSearch(query);
    if (!q) return songs;
    return songs.filter((s) => {
      const fields = [s.title, s.artist, s.title_reading, s.artist_reading].map(normalizeForSearch);
      return fields.some((f) => f.includes(q));
    });
  }, [songs, query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>今日のセットリスト</Text>
            <Text style={styles.subtitle}>{checked.size}曲選択中</Text>
          </View>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => { onSave(Array.from(checked)); onClose(); }}
          >
            <Text style={styles.saveText}>設定する</Text>
          </TouchableOpacity>
        </View>

        {/* 検索バー */}
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
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="検索をクリア"
            >
              <View style={styles.searchClear}>
                <Text style={styles.searchClearText}>✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 曲リスト */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
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
                  <View style={[styles.art, styles.artFallback]}>
                    <Text style={styles.artEmoji}>🎵</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={[styles.songTitle, isChecked && styles.songTitleChecked]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.artist} numberOfLines={1}>
                    {item.artist || '—'}
                  </Text>
                </View>
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />
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
  cancelBtn: { minWidth: 72 },
  cancelText: { fontSize: 14, color: colors.text2 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: {
    fontFamily: fonts.jakartaBold,
    fontSize: 15,
    color: colors.text,
  },
  subtitle: { fontSize: 11, color: colors.text3, marginTop: 1 },
  saveBtn: {
    minWidth: 72,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchIcon: { fontSize: 12 },
  searchInput: { flex: 1, fontSize: 12, color: colors.text },
  searchClear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: { color: colors.white, fontSize: 10 },
  list: { paddingHorizontal: 12, gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 10,
  },
  rowChecked: {
    borderColor: 'rgba(91, 76, 245, 0.3)',
    backgroundColor: colors.accentSoft,
  },
  art: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  artFallback: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artEmoji: { fontSize: 18 },
  info: { flex: 1 },
  songTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  songTitleChecked: { color: colors.accent },
  artist: { fontSize: 11, color: colors.text3, marginTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: { fontSize: 12, color: colors.white, fontWeight: '700' },
});
