import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { MAX_TAB_NAME_LENGTH } from '../../src/constants/tabConfig';
import { getTabById, updateTab, deleteTab, findDuplicateTab } from '../../src/db/tabs';
import { getAllSongs, getSongsByTab } from '../../src/db/songs';
import { setSongsForTab } from '../../src/db/songTabs';
import { TabSongPickerModal } from '../../src/components/TabSongPickerModal';
import { EmptyState } from '../../src/components/EmptyState';
import { useConfirm } from '../../src/components/ConfirmProvider';
import { SongWithStats, TabRow } from '../../src/types';

const BTN_HIT_SLOP = { top: 10, bottom: 10, left: 8, right: 8 };

export default function TabDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tabId = Number(id);
  const confirm = useConfirm();

  const [tab, setTab] = useState<TabRow | null>(null);
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [allSongs, setAllSongs] = useState<SongWithStats[]>([]);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  const reload = useCallback(() => {
    if (Platform.OS === 'web') return;
    try {
      setTab(getTabById(tabId));
      setSongs(getSongsByTab(tabId));
    } catch (e) {
      console.error(e);
    }
  }, [tabId]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  function openRename() {
    setRenameInput(tab?.name ?? '');
    setRenameVisible(true);
  }

  async function handleRename() {
    const name = renameInput.trim();
    if (!name) return;
    if (Platform.OS === 'web') { setRenameVisible(false); return; }
    if (findDuplicateTab(name, tabId)) {
      await confirm({ title: '同じ名前のタブがあります', message: `「${name}」はすでに存在します。別の名前を入力してください。`, options: [{ label: 'OK', style: 'primary' }], cancelLabel: null });
      return;
    }
    try {
      updateTab(tabId, name);
      reload();
    } catch (e) {
      console.error(e);
      await confirm({ title: 'エラー', message: '保存に失敗しました', options: [{ label: 'OK', style: 'primary' }], cancelLabel: null });
    }
    setRenameVisible(false);
  }

  async function handleDelete() {
    if (!tab) return;
    const r = await confirm({
      title: 'タブを削除',
      message: `「${tab.name}」を削除しますか？\n紐づく曲は削除されません。`,
      icon: '🗑',
      iconTone: 'red',
      options: [{ label: '削除する', style: 'danger' }],
    });
    if (r !== 0) return;
    if (Platform.OS === 'web') { router.back(); return; }
    try {
      deleteTab(tabId);
      router.back();
    } catch (e) {
      console.error(e);
      await confirm({ title: 'エラー', message: '削除に失敗しました', options: [{ label: 'OK', style: 'primary' }], cancelLabel: null });
    }
  }

  function openPicker() {
    if (Platform.OS !== 'web') setAllSongs(getAllSongs());
    setPickerVisible(true);
  }

  async function handleSavePicker(songIds: number[]) {
    if (Platform.OS === 'web') { setPickerVisible(false); return; }
    try {
      setSongsForTab(tabId, songIds);
      setPickerVisible(false);
      reload();
    } catch (e) {
      console.error(e);
      await confirm({ title: 'エラー', message: '曲の設定に失敗しました', options: [{ label: 'OK', style: 'primary' }], cancelLabel: null });
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={BTN_HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>タブの詳細設定</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* タブ名ヒーロー */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroIconText}>🗂</Text></View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={1}>{tab?.name ?? '—'}</Text>
            <Text style={styles.heroSub}>{songs.length} 曲が設定されています</Text>
          </View>
        </View>

        {/* アクション */}
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.actionRow} onPress={openRename}>
            <View style={styles.actionIcon}><Text style={styles.actionEmoji}>✏️</Text></View>
            <View style={styles.actionText}>
              <Text style={styles.actionName}>名前を変更</Text>
              <Text style={styles.actionDesc}>タブ名を編集する</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={openPicker}>
            <View style={styles.actionIcon}><Text style={styles.actionEmoji}>🎵</Text></View>
            <View style={styles.actionText}>
              <Text style={styles.actionName}>対応曲を変更</Text>
              <Text style={styles.actionDesc}>このタブに入れる曲をまとめて選ぶ</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.actionRowLast]} onPress={handleDelete}>
            <View style={[styles.actionIcon, styles.actionIconRed]}><Text style={styles.actionEmoji}>🗑</Text></View>
            <View style={styles.actionText}>
              <Text style={[styles.actionName, styles.danger]}>このタブを削除</Text>
              <Text style={styles.actionDesc}>曲自体は削除されません</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 所属曲一覧 */}
        <View style={styles.songsSection}>
          <View style={styles.songsLabelRow}>
            <Text style={styles.songsLabel}>このタブの曲</Text>
            <View style={styles.countPill}><Text style={styles.countPillText}>{songs.length}曲</Text></View>
          </View>
          {songs.length === 0 ? (
            <EmptyState
              emoji="🎵"
              title="まだ曲がありません"
              subtitle="「対応曲を変更」から曲を追加できます"
            />
          ) : (
            <View style={styles.songsList}>
              {songs.map((s) => (
                <View key={s.id} style={styles.songCard}>
                  {s.artwork_url ? (
                    <Image source={{ uri: s.artwork_url }} style={styles.songArt} />
                  ) : (
                    <View style={[styles.songArt, styles.songArtFallback]}><Text style={styles.songArtEmoji}>🎵</Text></View>
                  )}
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.songArtist} numberOfLines={1}>{s.artist || '—'}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 名前変更モーダル */}
      <Modal visible={renameVisible} transparent animationType="fade" onRequestClose={() => setRenameVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setRenameVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>タブ名を変更</Text>
          <TextInput
            style={styles.modalInput}
            value={renameInput}
            onChangeText={setRenameInput}
            placeholder="タブ名を入力"
            placeholderTextColor={colors.text3}
            autoFocus
            returnKeyType="done"
            maxLength={MAX_TAB_NAME_LENGTH}
            onSubmitEditing={handleRename}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameVisible(false)}>
              <Text style={styles.modalCancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirm} onPress={handleRename}>
              <Text style={styles.modalConfirmText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 対応曲を変更モーダル */}
      <TabSongPickerModal
        visible={pickerVisible}
        tabName={tab?.name ?? ''}
        songs={allSongs}
        selectedIds={songs.map((s) => s.id)}
        onSave={handleSavePicker}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 6, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, backgroundColor: colors.surface2, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 22, color: colors.accent, fontWeight: '600', lineHeight: 26 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  scroll: { paddingHorizontal: 18, gap: 16 },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  heroIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  heroIconText: { fontSize: 20 },
  heroInfo: { flex: 1, minWidth: 0 },
  heroName: { fontSize: 16, fontWeight: '700', color: colors.text },
  heroSub: { fontSize: 11, color: colors.text3, marginTop: 2 },
  actionGroup: {
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  actionRowLast: { borderBottomWidth: 0 },
  actionIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  actionIconRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  actionEmoji: { fontSize: 14 },
  actionText: { flex: 1 },
  actionName: { fontSize: 13, fontWeight: '600', color: colors.text },
  danger: { color: colors.red },
  actionDesc: { fontSize: 10, color: colors.text3, marginTop: 1 },
  chev: { fontSize: 18, color: colors.text3 },
  songsSection: { gap: 8 },
  songsLabelRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 2 },
  songsLabel: { fontSize: 10, color: colors.text3, fontWeight: '600', letterSpacing: 0.5 },
  countPill: { marginLeft: 8, backgroundColor: colors.accentSoft, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2 },
  countPillText: { fontSize: 10, color: colors.accent, fontWeight: '700' },
  songsList: { gap: 6 },
  songCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 9,
  },
  songArt: { width: 34, height: 34, borderRadius: 9 },
  songArtFallback: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  songArtEmoji: { fontSize: 15 },
  songInfo: { flex: 1, minWidth: 0 },
  songTitle: { fontSize: 12, fontWeight: '600', color: colors.text },
  songArtist: { fontSize: 10, color: colors.text3, marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox: {
    position: 'absolute', top: '40%', left: 32, right: 32,
    backgroundColor: colors.white, borderRadius: 16, padding: 20, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  modalInput: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 8 },
  modalCancelText: { fontSize: 13, color: colors.text2 },
  modalConfirm: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  modalConfirmText: { fontSize: 13, fontWeight: '700', color: colors.white },
});
