// 曲詳細の「キー・テンポ・メモ」カード。歌いながらその場で調整できるよう、
// キー・テンポは －／＋ で即保存、メモはダイアログで書き換える。
// 曲名・アルバムアート・タブなど「曲そのもの」の情報は編集画面で扱う。

import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors } from '../constants/colors';
import { MAX_MEMO_LENGTH } from '../constants/songFields';
import {
  executeMemoSave,
  getMemoSaveButtonLabel,
  isMemoDraftDirty,
} from '../lib/memoEditor';
import { DiscardChangesModal } from './DiscardChangesModal';
import { KeyStepper } from './KeyStepper';

interface Props {
  keyOffset: number | null;
  tempoOffset: number | null;
  memo: string;
  onChangeKey: (value: number | null) => void;
  onChangeTempo: (value: number | null) => void;
  onChangeMemo: (value: string) => Promise<boolean> | boolean;
}

export function SingingInfoCard({ keyOffset, tempoOffset, memo, onChangeKey, onChangeTempo, onChangeMemo }: Props) {
  const [memoEditing, setMemoEditing] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoSaveError, setMemoSaveError] = useState<string | null>(null);
  const [discardConfirmVisible, setDiscardConfirmVisible] = useState(false);
  const savingRef = useRef(false);

  function openMemoEditor() {
    setMemoDraft(memo);
    setMemoSaveError(null);
    setDiscardConfirmVisible(false);
    setMemoEditing(true);
  }

  function forceCloseMemoEditor() {
    Keyboard.dismiss();
    setDiscardConfirmVisible(false);
    setMemoSaveError(null);
    setMemoEditing(false);
  }

  function requestCloseMemoEditor() {
    if (savingRef.current) return;
    if (isMemoDraftDirty(memo, memoDraft)) {
      Keyboard.dismiss();
      setDiscardConfirmVisible(true);
      return;
    }
    forceCloseMemoEditor();
  }

  function handleMemoDraftChange(text: string) {
    setMemoDraft(text);
    if (memoSaveError) setMemoSaveError(null);
  }

  async function saveMemo() {
    if (savingRef.current) return;
    savingRef.current = true;
    setMemoSaving(true);
    setMemoSaveError(null);
    try {
      const result = await executeMemoSave(memoDraft, onChangeMemo);
      if (result.ok) {
        forceCloseMemoEditor();
      } else {
        setMemoSaveError(result.error);
      }
    } finally {
      savingRef.current = false;
      setMemoSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <AdjustRow
        label="キー"
        sub="半音単位・±7"
        value={keyOffset}
        onChange={onChangeKey}
      />
      <AdjustRow
        label="テンポ"
        sub="±7まで"
        value={tempoOffset}
        onChange={onChangeTempo}
      />

      <View style={styles.memoHeader}>
        <Text style={styles.memoLabel}>メモ</Text>
        <TouchableOpacity
          onPress={openMemoEditor}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={memo ? 'メモを編集' : 'メモを追加'}
        >
          <Text style={styles.memoEdit}>{memo ? '✏️ 編集' : '✏️ 追加'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={openMemoEditor} activeOpacity={0.6} accessibilityRole="button">
        {memo ? (
          <Text style={styles.memoText}>{memo}</Text>
        ) : (
          <Text style={styles.memoPlaceholder}>タップしてメモを追加</Text>
        )}
      </TouchableOpacity>

      {/* メモ編集ダイアログ（U28: 保存成功を待って閉じ、失敗時は下書き保持＋再試行） */}
      <Modal
        visible={memoEditing}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={requestCloseMemoEditor}
      >
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <TouchableWithoutFeedback onPress={requestCloseMemoEditor}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>メモ</Text>
            <TextInput
              style={[styles.modalInput, memoSaveError ? styles.modalInputError : null]}
              value={memoDraft}
              onChangeText={handleMemoDraftChange}
              maxLength={MAX_MEMO_LENGTH}
              placeholder="メモ（自由入力）"
              placeholderTextColor={colors.text3}
              multiline
              textAlignVertical="top"
              editable={!memoSaving}
              autoFocus
            />
            {memoSaveError && (
              <Text style={styles.modalErrorText}>{memoSaveError}</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancel, memoSaving && styles.modalBtnDisabled]}
                onPress={requestCloseMemoEditor}
                disabled={memoSaving}
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, memoSaving && styles.modalBtnDisabled]}
                onPress={saveMemo}
                disabled={memoSaving}
                accessibilityRole="button"
              >
                <Text style={styles.modalConfirmText}>
                  {getMemoSaveButtonLabel(memoSaving, memoSaveError !== null)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 未保存メモの破棄確認（U03 / U28） */}
      <DiscardChangesModal
        visible={discardConfirmVisible}
        onKeepEditing={() => setDiscardConfirmVisible(false)}
        onDiscard={forceCloseMemoEditor}
      />
    </View>
  );
}

function AdjustRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text style={styles.rowTitle}>{label}</Text>
        {value !== null ? (
          <TouchableOpacity
            onPress={() => onChange(null)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`${label}を未設定に戻す`}
          >
            <Text style={styles.rowReset}>未設定に戻す</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.rowSub}>{sub}</Text>
        )}
      </View>
      <KeyStepper value={value} onChange={onChange} helperText={null} showReset={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, gap: 1 },
  rowTitle: { fontSize: 12, fontWeight: '700', color: colors.text2 },
  rowSub: { fontSize: 9, color: colors.text3 },
  rowReset: { fontSize: 9, color: colors.accent },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 4,
  },
  memoLabel: {
    fontSize: 10,
    color: colors.text2,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  memoEdit: { fontSize: 11, fontWeight: '700', color: colors.accent },
  memoText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  memoPlaceholder: { fontSize: 13, color: colors.text3, lineHeight: 20 },

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
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
    minHeight: 120,
  },
  modalInputError: {
    borderColor: colors.red,
  },
  modalErrorText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.red,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: colors.text2 },
  modalConfirm: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: colors.white },
  modalBtnDisabled: { opacity: 0.6 },
});
