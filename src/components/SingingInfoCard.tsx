// 曲詳細の「キー・テンポ・メモ」カード。歌いながらその場で調整できるよう、
// キー・テンポは －／＋ で即保存、メモはダイアログで書き換える。
// 曲名・アルバムアート・タブなど「曲そのもの」の情報は編集画面で扱う。

import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors } from '../constants/colors';
import { MAX_MEMO_LENGTH } from '../constants/songFields';
import { KeyStepper } from './KeyStepper';

interface Props {
  keyOffset: number | null;
  tempoOffset: number | null;
  memo: string;
  onChangeKey: (value: number | null) => void;
  onChangeTempo: (value: number | null) => void;
  onChangeMemo: (value: string) => void;
}

export function SingingInfoCard({ keyOffset, tempoOffset, memo, onChangeKey, onChangeTempo, onChangeMemo }: Props) {
  const [memoEditing, setMemoEditing] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');

  function openMemoEditor() {
    setMemoDraft(memo);
    setMemoEditing(true);
  }

  function closeMemoEditor() {
    Keyboard.dismiss();
    setMemoEditing(false);
  }

  function saveMemo() {
    onChangeMemo(memoDraft.trim());
    closeMemoEditor();
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

      {/* メモ編集ダイアログ */}
      <Modal visible={memoEditing} transparent animationType="fade" statusBarTranslucent onRequestClose={closeMemoEditor}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableWithoutFeedback onPress={closeMemoEditor}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>メモ</Text>
            <TextInput
              style={styles.modalInput}
              value={memoDraft}
              onChangeText={setMemoDraft}
              maxLength={MAX_MEMO_LENGTH}
              placeholder="メモ（自由入力）"
              placeholderTextColor={colors.text3}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={closeMemoEditor}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={saveMemo}>
                <Text style={styles.modalConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    minHeight: 110,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 8 },
  modalCancelText: { fontSize: 13, color: colors.text2 },
  modalConfirm: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  modalConfirmText: { fontSize: 13, fontWeight: '700', color: colors.white },
});
