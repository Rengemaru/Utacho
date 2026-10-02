import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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
import { colors } from '../src/constants/colors';
import { MAX_TAB_NAME_LENGTH } from '../src/constants/tabConfig';
import { insertTab, updateTab, deleteTab, updateTabOrder, findDuplicateTab } from '../src/db/tabs';
import { useTabs } from '../src/hooks/useTabs';
import { EmptyState } from '../src/components/EmptyState';
import { TabRow } from '../src/types';

// 小さいアイコンボタンのタップ領域を広げ、誤タップを減らす（推奨44pt相当を確保）
const BTN_HIT_SLOP = { top: 10, bottom: 10, left: 8, right: 8 };

export default function TabsScreen() {
  const insets = useSafeAreaInsets();
  const { tabs, reload } = useTabs();
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingTab, setEditingTab] = useState<TabRow | null>(null);
  const [inputName, setInputName] = useState('');

  function openAddModal() {
    setInputName('');
    setEditingTab(null);
    setModalMode('add');
  }

  function openEditModal(tab: TabRow) {
    setInputName(tab.name);
    setEditingTab(tab);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingTab(null);
    setInputName('');
  }

  function handleConfirm() {
    const name = inputName.trim();
    if (!name) return;
    if (Platform.OS === 'web') { closeModal(); return; }
    // リネーム時は自分自身を除外して重複判定する
    const excludeId = modalMode === 'edit' && editingTab ? editingTab.id : undefined;
    if (findDuplicateTab(name, excludeId)) {
      Alert.alert('同じ名前のタブがあります', `「${name}」はすでに存在します。別の名前を入力してください。`);
      return; // モーダルは開いたままにして入力し直せるようにする
    }
    try {
      if (modalMode === 'add') {
        insertTab(name);
      } else if (modalMode === 'edit' && editingTab) {
        updateTab(editingTab.id, name);
      }
      reload();
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '保存に失敗しました');
    }
    closeModal();
  }

  function handleDelete(tab: TabRow) {
    Alert.alert(
      'タブを削除',
      `「${tab.name}」を削除しますか？\n紐づく曲は削除されません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'web') { return; }
            try {
              deleteTab(tab.id);
              reload();
            } catch (e) {
              console.error(e);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  }

  function moveTab(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tabs.length) return;
    if (Platform.OS === 'web') return;
    const newTabs = [...tabs];
    [newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]];
    try {
      updateTabOrder(newTabs.map((t, i) => ({ id: t.id, sort_order: i + 1 })));
      reload();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>タブを編集</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <Text style={styles.hint}>タブはカラオケの持ち歌カテゴリです。曲に複数のタブを付けられます。</Text>

        <View style={styles.group}>
          {tabs.length === 0 ? (
            <EmptyState
              emoji="🗂"
              title="タブがありません"
              subtitle="「＋ タブを追加」からカテゴリを作成しましょう"
            />
          ) : (
            tabs.map((tab, index) => (
              <View
                key={tab.id}
                style={[styles.row, index === tabs.length - 1 && styles.rowLast]}
              >
                <View style={styles.tabIcon}>
                  <Text style={styles.tabIconText}>🗂</Text>
                </View>
                <Text style={styles.tabName} numberOfLines={1} ellipsizeMode="tail">{tab.name}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                    onPress={() => moveTab(index, 'up')}
                    disabled={index === 0}
                    hitSlop={BTN_HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel={`${tab.name}を上へ移動`}
                  >
                    <Text style={[styles.arrowText, index === 0 && styles.arrowTextDisabled]}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.arrowBtn, index === tabs.length - 1 && styles.arrowBtnDisabled]}
                    onPress={() => moveTab(index, 'down')}
                    disabled={index === tabs.length - 1}
                    hitSlop={BTN_HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel={`${tab.name}を下へ移動`}
                  >
                    <Text style={[styles.arrowText, index === tabs.length - 1 && styles.arrowTextDisabled]}>↓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditModal(tab)}
                    hitSlop={BTN_HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel={`${tab.name}の名前を変更`}
                  >
                    <Text style={styles.editBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(tab)}
                    hitSlop={BTN_HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel={`${tab.name}を削除`}
                  >
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>＋ タブを追加</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 追加・編集モーダル */}
      <Modal
        visible={modalMode !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>
            {modalMode === 'add' ? '新しいタブを作成' : 'タブ名を変更'}
          </Text>
          <TextInput
            style={[
              styles.modalInput,
              inputName.length > MAX_TAB_NAME_LENGTH && styles.modalInputError,
            ]}
            value={inputName}
            onChangeText={setInputName}
            placeholder="タブ名を入力"
            placeholderTextColor={colors.text3}
            autoFocus
            returnKeyType="done"
            maxLength={MAX_TAB_NAME_LENGTH}
            onSubmitEditing={handleConfirm}
          />
          <Text style={[
            styles.charCount,
            inputName.length >= MAX_TAB_NAME_LENGTH * 0.9 && styles.charCountWarn,
          ]}>
            {inputName.length}/{MAX_TAB_NAME_LENGTH}
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={closeModal}>
              <Text style={styles.modalCancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirm} onPress={handleConfirm}>
              <Text style={styles.modalConfirmText}>
                {modalMode === 'add' ? '作成' : '保存'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 6,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 22,
    color: colors.accent,
    fontWeight: '600',
    lineHeight: 26,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: 18,
    gap: 14,
  },
  hint: {
    fontSize: 11,
    color: colors.text3,
    lineHeight: 16,
  },
  group: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  tabIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tabIconText: {
    fontSize: 14,
  },
  tabName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 13,
    color: colors.text2,
    fontWeight: '600',
  },
  arrowTextDisabled: {
    color: colors.text3,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 13,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    position: 'absolute',
    top: '40%',
    left: 32,
    right: 32,
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
