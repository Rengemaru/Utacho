import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
import { KeyStepper, TEMPO_HELPER_TEXT } from '../../src/components/KeyStepper';
import { colors } from '../../src/constants/colors';
import { insertSong, updateSong, getSongById, findDuplicateSong } from '../../src/db/songs';
import { insertTab, findDuplicateTab } from '../../src/db/tabs';
import { syncTabs } from '../../src/db/songTabs';
import { useTabs } from '../../src/hooks/useTabs';
import { MOCK_SONGS } from '../../src/db/mockData';
import { useConfirm } from '../../src/components/ConfirmProvider';

import { MAX_TAB_NAME_LENGTH, truncateTabName } from '../../src/constants/tabConfig';

import { MAX_MEMO_LENGTH, MAX_NAME_LENGTH } from '../../src/constants/songFields';

export default function SongFormScreen() {
  const insets = useSafeAreaInsets();
  // 新規追加は「さがす」タブで選んだ候補（title/artist/artworkUrl）を受け取る。手入力時はパラメータなし
  const params = useLocalSearchParams<{ songId?: string; title?: string; artist?: string; artworkUrl?: string }>();
  const { songId } = params;
  const isEdit = !!songId;

  const { tabs, loading: tabsLoading, reload: reloadTabs } = useTabs();
  const confirm = useConfirm();
  const [title, setTitle] = useState(isEdit ? '' : params.title ?? '');
  const [artist, setArtist] = useState(isEdit ? '' : params.artist ?? '');
  const [keyOffset, setKeyOffset] = useState<number | null>(null);
  const [tempoOffset, setTempoOffset] = useState<number | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(isEdit ? null : params.artworkUrl || null);
  const [memo, setMemo] = useState('');
  const [titleReading, setTitleReading] = useState('');
  const [artistReading, setArtistReading] = useState('');
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [newTabModalVisible, setNewTabModalVisible] = useState(false);
  const [newTabName, setNewTabName] = useState('');


  useEffect(() => {
    if (!isEdit) return;
    try {
      const song = Platform.OS === 'web'
        ? MOCK_SONGS.find(s => s.id === Number(songId)) ?? null
        : getSongById(Number(songId));
      if (!song) return;
      setTitle(song.title);
      setArtist(song.artist);
      setArtworkUrl(song.artwork_url);
      setTitleReading(song.title_reading ?? '');
      setArtistReading(song.artist_reading ?? '');
      setSelectedTabIds(song.tabs?.map((t) => t.id) ?? []);
    } catch (e) {
      console.error(e);
    }
  }, [songId, isEdit]);

  // Bug-1: タブが削除・追加されたとき、存在しないタブIDをselectedTabIdsから除去する。
  // ただしタブ一覧のロード完了前（tabsLoading中・tabs=[]）は絞り込まない。
  // ここで走らせると、曲のタブを復元する Effect 1 と同じバッチで filter が実行され、
  // 関数型アップデータの prev は [3,5]（Effect 1の結果）なのにクロージャの tabs は
  // 初回レンダーの [] を掴んでいるため、設定済みタブが全部外れてしまう。
  useEffect(() => {
    if (!isEdit || tabsLoading) return;
    setSelectedTabIds((prev) => prev.filter((id) => tabs.some((t) => t.id === id)));
  }, [tabs, tabsLoading, isEdit]);

  function toggleTab(tabId: number) {
    setSelectedTabIds((prev) =>
      prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
    );
  }

  function handleAddNewTab() {
    setNewTabName('');
    setNewTabModalVisible(true);
  }

  async function handleConfirmNewTab() {
    const name = newTabName.trim();
    if (!name) return;
    if (Platform.OS === 'web') { setNewTabModalVisible(false); return; }
    if (findDuplicateTab(name)) {
      await confirm({ title: '同じ名前のタブがあります', message: `「${name}」はすでに存在します。別の名前を入力してください。`, options: [{ label: 'OK', style: 'primary' }], cancelLabel: null });
      return; // モーダルは開いたままにして入力し直せるようにする
    }
    try {
      const newId = insertTab(name);
      reloadTabs();
      setSelectedTabIds((prev) => [...prev, newId]);
    } catch (e) {
      console.error(e);
      await confirm({ title: 'エラー', message: 'タブの作成に失敗しました', options: [{ label: 'OK', style: 'primary' }], cancelLabel: null });
    }
    Keyboard.dismiss(); // Bug-3: Android でキーボードが残存する問題を修正
    setNewTabModalVisible(false);
  }

  async function handleSave() {
    if (!title.trim()) {
      await confirm({ title: '入力エラー', message: '曲名を入力してください', options: [{ label: 'OK', style: 'primary' }], cancelLabel: null });
      return;
    }
    if (Platform.OS === 'web') { router.back(); return; }

    async function doSave() {
      try {
        if (isEdit) {
          updateSong(Number(songId), title.trim(), artist.trim(), artworkUrl, titleReading.trim(), artistReading.trim());
          syncTabs(Number(songId), selectedTabIds);
        } else {
          const newId = insertSong(title.trim(), artist.trim(), keyOffset, artworkUrl, memo, titleReading.trim(), artistReading.trim(), tempoOffset);
          syncTabs(newId, selectedTabIds);
          // 追加後は「さがす」タブではなく曲一覧に戻し、登録した曲が見えるようにする
          router.dismissTo('/');
          return;
        }
        router.back();
      } catch (e) {
        console.error(e);
        await confirm({ title: 'エラー', message: '保存に失敗しました', options: [{ label: 'OK', style: 'primary' }], cancelLabel: null });
      }
    }

    // 重複登録チェック（新規・編集とも）。編集時は自分自身を除外する（§5.10）
    const duplicate = findDuplicateSong(
      title.trim(),
      artist.trim(),
      isEdit ? Number(songId) : undefined,
    );
    if (duplicate) {
      const artistLabel = artist.trim() ? `（${artist.trim()}）` : '';
      const r = await confirm({
        title: '重複登録',
        message: `「${title.trim()}」${artistLabel}はすでに登録されています。それでも${isEdit ? '保存' : '追加'}しますか？`,
        icon: '⚠️',
        iconTone: 'red',
        options: [{ label: `それでも${isEdit ? '保存' : '登録'}する`, style: 'danger' }],
        cancelLabel: '戻る',
      });
      if (r === 0) await doSave();
      return;
    }

    await doSave();
  }

  return (
    // Android もキーボードぶん下に余白を足す。Expo SDK 54 以降は edge-to-edge が必須で、
    // softwareKeyboardLayoutMode: "resize"（adjustResize）を指定してもウィンドウが縮まず、
    // 下の方のメモ欄や保存ボタンがキーボードに隠れていたため
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
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
          {/* 曲名（サジェストなしのテキスト欄・§5.8/5.9） */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>曲名</Text>
            <TextInput
              style={styles.fieldInput}
              value={title}
              onChangeText={setTitle}
              maxLength={MAX_NAME_LENGTH}
              placeholder="曲名"
              placeholderTextColor={colors.text3}
              returnKeyType="next"
            />
          </View>

          {/* 曲名の読み（任意・ローカル検索用 #42） */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>曲名の読み（任意）</Text>
            <TextInput
              style={styles.fieldInput}
              value={titleReading}
              onChangeText={setTitleReading}
              maxLength={MAX_NAME_LENGTH}
              placeholder="れい：よるにかける"
              placeholderTextColor={colors.text3}
              returnKeyType="next"
            />
          </View>

          {/* アーティスト名（サジェストなしのテキスト欄） */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>アーティスト名</Text>
            <TextInput
              style={styles.fieldInput}
              value={artist}
              onChangeText={setArtist}
              maxLength={MAX_NAME_LENGTH}
              placeholder="アーティスト名"
              placeholderTextColor={colors.text3}
              returnKeyType="next"
            />
          </View>

          {/* アーティストの読み（任意・ローカル検索用 #42） */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>アーティストの読み（任意）</Text>
            <TextInput
              style={styles.fieldInput}
              value={artistReading}
              onChangeText={setArtistReading}
              maxLength={MAX_NAME_LENGTH}
              placeholder="れい：よあそび"
              placeholderTextColor={colors.text3}
              returnKeyType="done"
            />
          </View>

          {/* アルバムアート（別の曲にしたい場合は、さがすタブから新しく追加する） */}
          <View style={styles.songRow}>
            {artworkUrl ? (
              <Image source={{ uri: artworkUrl }} style={styles.songArt} />
            ) : (
              <View style={[styles.songArt, styles.songArtPlaceholder]}>
                <Text style={styles.songArtPlaceholderText}>🎵</Text>
              </View>
            )}
            <View style={styles.songRowInfo}>
              <Text style={styles.songRowLabel}>アルバムアート</Text>
              <Text style={styles.songRowSub}>{artworkUrl ? '検索で選んだ曲のもの' : '未設定'}</Text>
            </View>
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

          {/* キー・テンポ・メモは「歌い方」の情報。新規登録時はここで入力し、
              登録後は曲詳細画面でその場で調整する（編集画面には出さない） */}
          {isEdit ? (
            <View style={styles.movedNote}>
              <Text style={styles.movedNoteText}>💡 キー・テンポ・メモは曲詳細画面からすぐ変更できます</Text>
            </View>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>キー（音域）</Text>
                <KeyStepper value={keyOffset} onChange={setKeyOffset} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>テンポ</Text>
                <KeyStepper value={tempoOffset} onChange={setTempoOffset} helperText={TEMPO_HELPER_TEXT} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>メモ</Text>
                <TextInput
                  style={[styles.fieldInput, styles.memoInput]}
                  value={memo}
                  onChangeText={setMemo}
                  maxLength={MAX_MEMO_LENGTH}
                  placeholder="メモ（自由入力）"
                  placeholderTextColor={colors.text3}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </>
          )}
        </ScrollView>

        {/* 新規タブ作成モーダル */}
        <Modal visible={newTabModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setNewTabModalVisible(false)}>
          <KeyboardAvoidingView style={styles.flex} behavior="padding">
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
  movedNote: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  movedNoteText: {
    fontSize: 11,
    color: colors.accent,
  },
  // アルバムアート行
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 11,
    padding: 10,
  },
  songArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  songArtPlaceholder: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songArtPlaceholderText: {
    fontSize: 20,
  },
  songRowInfo: {
    flex: 1,
  },
  songRowLabel: {
    fontSize: 11,
    color: colors.text2,
    fontWeight: '500',
  },
  songRowSub: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 2,
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
