import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
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
import { KeyStepper } from '../../src/components/KeyStepper';
import { colors } from '../../src/constants/colors';
import { insertSong, updateSong, getSongById, findDuplicateSong } from '../../src/db/songs';
import { insertTab, findDuplicateTab } from '../../src/db/tabs';
import { syncTabs } from '../../src/db/songTabs';
import { useTabs } from '../../src/hooks/useTabs';
import { useMusicSearch } from '../../src/hooks/useMusicSearch';
import { MOCK_SONGS } from '../../src/db/mockData';
import { MusicSuggestion } from '../../src/types';

import { MAX_TAB_NAME_LENGTH, truncateTabName } from '../../src/constants/tabConfig';

export default function SongFormScreen() {
  const insets = useSafeAreaInsets();
  const { songId } = useLocalSearchParams<{ songId?: string }>();
  const isEdit = !!songId;

  const { tabs, reload: reloadTabs } = useTabs();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [keyOffset, setKeyOffset] = useState<number | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [newTabModalVisible, setNewTabModalVisible] = useState(false);
  const [newTabName, setNewTabName] = useState('');

  const {
    suggestions: titleSuggestions,
    isSearching: isTitleSearching,
    clearSuggestions: clearTitleSuggestions,
    resumeSearch: resumeTitleSearch,
  } = useMusicSearch(title, 300, 'songTerm');

  const {
    suggestions: artistSuggestions,
    isSearching: isArtistSearching,
    clearSuggestions: clearArtistSuggestions,
    resumeSearch: resumeArtistSearch,
  } = useMusicSearch(artist, 300, 'artistTerm');

  useEffect(() => {
    if (!isEdit) return;
    resumeTitleSearch();
    resumeArtistSearch();
    try {
      const song = Platform.OS === 'web'
        ? MOCK_SONGS.find(s => s.id === Number(songId)) ?? null
        : getSongById(Number(songId));
      if (!song) return;
      setTitle(song.title);
      setArtist(song.artist);
      setKeyOffset(song.key_offset);
      setArtworkUrl(song.artwork_url);
      setMemo(song.memo);
      setSelectedTabIds(song.tabs?.map((t) => t.id) ?? []);
    } catch (e) {
      console.error(e);
    }
  }, [songId, isEdit]);

  // Bug-1: タブが削除・追加されたとき、存在しないタブIDをselectedTabIdsから除去する
  useEffect(() => {
    if (!isEdit) return;
    setSelectedTabIds((prev) => prev.filter((id) => tabs.some((t) => t.id === id)));
  }, [tabs, isEdit]);

  function handleSelectSuggestion(item: MusicSuggestion) {
    setTitle(item.trackName);
    setArtist(item.artistName);
    setArtworkUrl(item.artworkUrl);
    clearTitleSuggestions();
    clearArtistSuggestions();
  }

  function toggleTab(tabId: number) {
    setSelectedTabIds((prev) =>
      prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
    );
  }

  function handleAddNewTab() {
    setNewTabName('');
    setNewTabModalVisible(true);
  }

  function handleConfirmNewTab() {
    const name = newTabName.trim();
    if (!name) return;
    if (Platform.OS === 'web') { setNewTabModalVisible(false); return; }
    if (findDuplicateTab(name)) {
      Alert.alert('同じ名前のタブがあります', `「${name}」はすでに存在します。別の名前を入力してください。`);
      return; // モーダルは開いたままにして入力し直せるようにする
    }
    try {
      const newId = insertTab(name);
      reloadTabs();
      setSelectedTabIds((prev) => [...prev, newId]);
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', 'タブの作成に失敗しました');
    }
    Keyboard.dismiss(); // Bug-3: Android でキーボードが残存する問題を修正
    setNewTabModalVisible(false);
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('入力エラー', '曲名を入力してください');
      return;
    }
    if (Platform.OS === 'web') { router.back(); return; }

    function doSave() {
      try {
        if (isEdit) {
          updateSong(Number(songId), title.trim(), artist.trim(), keyOffset, artworkUrl, memo);
          syncTabs(Number(songId), selectedTabIds);
        } else {
          const newId = insertSong(title.trim(), artist.trim(), keyOffset, artworkUrl, memo);
          syncTabs(newId, selectedTabIds);
        }
        router.back();
      } catch (e) {
        console.error(e);
        Alert.alert('エラー', '保存に失敗しました');
      }
    }

    if (!isEdit) {
      const duplicate = findDuplicateSong(title.trim(), artist.trim());
      if (duplicate) {
        const artistLabel = artist.trim() ? `（${artist.trim()}）` : '';
        Alert.alert(
          '重複登録',
          `「${title.trim()}」${artistLabel}はすでに登録されています。それでも追加しますか？`,
          [
            { text: '戻る', style: 'cancel' },
            { text: 'それでも登録する', onPress: doSave },
          ]
        );
        return;
      }
    }

    doSave();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? '曲を編集' : '曲を追加'}</Text>
        </View>

        {/* フォーム */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 曲名 + サジェスト */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>曲名</Text>
              {isTitleSearching && <ActivityIndicator size="small" color={colors.accent} style={styles.searchSpinner} />}
            </View>
            <TextInput
              style={styles.fieldInput}
              value={title}
              onChangeText={(v) => { setTitle(v); setArtworkUrl(null); resumeTitleSearch(); }}
              placeholder="曲名で検索"
              placeholderTextColor={colors.text3}
              returnKeyType="next"
            />
            {titleSuggestions.length > 0 && (
              <View style={styles.suggestBox}>
                <View style={styles.suggestHeader}>
                  <Text style={styles.suggestHeaderText}>候補</Text>
                  <TouchableOpacity
                    onPress={clearTitleSuggestions}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="候補を閉じる"
                  >
                    <Text style={styles.suggestClose}>✕ 閉じる</Text>
                  </TouchableOpacity>
                </View>
                {titleSuggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.suggestRow, idx === titleSuggestions.length - 1 && styles.suggestRowLast]}
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.7}
                  >
                    {item.artworkUrl ? (
                      <Image source={{ uri: item.artworkUrl }} style={styles.suggestArt} />
                    ) : (
                      <View style={[styles.suggestArt, styles.suggestArtPlaceholder]}>
                        <Text style={styles.suggestArtPlaceholderText}>♪</Text>
                      </View>
                    )}
                    <View style={styles.suggestInfo}>
                      <Text style={styles.suggestTitle} numberOfLines={1}>{item.trackName}</Text>
                      <Text style={styles.suggestArtist} numberOfLines={1}>{item.artistName}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* アートワークプレビュー（サジェスト選択時のみ表示） */}
          {artworkUrl && (
            <View style={styles.artworkPreviewRow}>
              <Image source={{ uri: artworkUrl }} style={styles.artworkPreview} />
              <View style={styles.artworkPreviewInfo}>
                <Text style={styles.artworkPreviewLabel}>アルバムアート取得済み</Text>
                <TouchableOpacity onPress={() => setArtworkUrl(null)}>
                  <Text style={styles.artworkPreviewRemove}>削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* アーティスト名 + サジェスト */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>アーティスト名</Text>
              {isArtistSearching && <ActivityIndicator size="small" color={colors.accent} style={styles.searchSpinner} />}
            </View>
            <TextInput
              style={styles.fieldInput}
              value={artist}
              onChangeText={(v) => { setArtist(v); resumeArtistSearch(); }}
              placeholder="アーティスト名で検索"
              placeholderTextColor={colors.text3}
              returnKeyType="done"
            />
            {artistSuggestions.length > 0 && (
              <View style={styles.suggestBox}>
                <View style={styles.suggestHeader}>
                  <Text style={styles.suggestHeaderText}>候補</Text>
                  <TouchableOpacity
                    onPress={clearArtistSuggestions}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="候補を閉じる"
                  >
                    <Text style={styles.suggestClose}>✕ 閉じる</Text>
                  </TouchableOpacity>
                </View>
                {artistSuggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.suggestRow, idx === artistSuggestions.length - 1 && styles.suggestRowLast]}
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.7}
                  >
                    {item.artworkUrl ? (
                      <Image source={{ uri: item.artworkUrl }} style={styles.suggestArt} />
                    ) : (
                      <View style={[styles.suggestArt, styles.suggestArtPlaceholder]}>
                        <Text style={styles.suggestArtPlaceholderText}>♪</Text>
                      </View>
                    )}
                    <View style={styles.suggestInfo}>
                      <Text style={styles.suggestTitle} numberOfLines={1}>{item.trackName}</Text>
                      <Text style={styles.suggestArtist} numberOfLines={1}>{item.artistName}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* タブ選択 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>タブ（カテゴリ）</Text>
            <View style={styles.tabSelector}>
              {tabs.map((tab) => {
                const isSelected = selectedTabIds.includes(tab.id);
                return (
                  <TouchableOpacity
                    key={tab.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.tabOption, isSelected && styles.tabOptionSelected]}
                    onPress={() => toggleTab(tab.id)}
                  >
                    <Text style={[styles.tabOptionText, isSelected && styles.tabOptionTextSelected]}>
                      {isSelected ? '✓ ' : ''}{truncateTabName(tab.name)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.tabOptionAdd} onPress={handleAddNewTab}>
                <Text style={styles.tabOptionAddText}>＋ 新規作成</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* キーステッパー */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>キー（音域）</Text>
            <KeyStepper value={keyOffset} onChange={setKeyOffset} />
          </View>

          {/* メモ */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>メモ</Text>
            <TextInput
              style={[styles.fieldInput, styles.memoInput]}
              value={memo}
              onChangeText={setMemo}
              placeholder="メモ（自由入力）"
              placeholderTextColor={colors.text3}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* 新規タブ作成モーダル */}
        <Modal visible={newTabModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setNewTabModalVisible(false)}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableWithoutFeedback onPress={() => setNewTabModalVisible(false)}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>新しいタブを作成</Text>
            <TextInput
              style={[
                styles.modalInput,
                newTabName.length >= MAX_TAB_NAME_LENGTH && styles.modalInputError,
              ]}
              value={newTabName}
              onChangeText={setNewTabName}
              placeholder="タブ名を入力"
              placeholderTextColor={colors.text3}
              autoFocus
              returnKeyType="done"
              maxLength={MAX_TAB_NAME_LENGTH}
              onSubmitEditing={handleConfirmNewTab}
            />
            <Text style={[
              styles.charCount,
              newTabName.length >= MAX_TAB_NAME_LENGTH * 0.9 && styles.charCountWarn,
            ]}>
              {newTabName.length}/{MAX_TAB_NAME_LENGTH}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setNewTabModalVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleConfirmNewTab}>
                <Text style={styles.modalConfirmText}>作成</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* 保存ボタン */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>
              {isEdit ? '変更を保存する' : '曲を追加する'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  closeBtn: {
    fontSize: 18,
    color: colors.text2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  form: {
    paddingHorizontal: 18,
    gap: 16,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.text2,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
    color: colors.text,
  },
  memoInput: {
    minHeight: 72,
    paddingTop: 11,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchSpinner: {
    marginBottom: 2,
  },
  suggestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  suggestHeaderText: {
    fontSize: 10,
    color: colors.text3,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  suggestClose: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
  suggestBox: {
    marginTop: 4,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 11,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestRowLast: {
    borderBottomWidth: 0,
  },
  suggestArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  suggestArtPlaceholder: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestArtPlaceholderText: {
    fontSize: 16,
    color: colors.text3,
  },
  suggestInfo: {
    flex: 1,
  },
  suggestTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  suggestArtist: {
    fontSize: 11,
    color: colors.text2,
    marginTop: 2,
  },
  artworkPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.2)',
    borderRadius: 11,
    padding: 10,
  },
  artworkPreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  artworkPreviewInfo: {
    flex: 1,
    gap: 4,
  },
  artworkPreviewLabel: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '500',
  },
  artworkPreviewRemove: {
    fontSize: 11,
    color: colors.red,
  },
  tabSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tabOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabOptionSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  tabOptionText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text2,
  },
  tabOptionTextSelected: {
    color: colors.accent,
  },
  tabOptionAdd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  tabOptionAddText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text3,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    marginHorizontal: 32,
    marginBottom: 'auto',
    marginTop: 'auto',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  modalInputError: {
    borderColor: colors.red,
  },
  charCount: {
    fontSize: 10,
    color: colors.text3,
    textAlign: 'right',
    marginTop: -8,
  },
  charCountWarn: {
    color: colors.red,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 13,
    color: colors.text2,
  },
  modalConfirm: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});
