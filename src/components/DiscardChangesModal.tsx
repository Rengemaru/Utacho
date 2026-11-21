import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

interface Props {
  visible: boolean;
  /** 「編集を続ける」= 変更を保持して閉じない（主強調） */
  onKeepEditing: () => void;
  /** 「破棄して閉じる」= 変更を失って離脱 */
  onDiscard: () => void;
}

/**
 * 未保存の変更を破棄する前の確認ダイアログ（U03 #132）。
 * Figma 統合版の破棄確認（node 105-2071）に忠実：
 * アイコンなし・縦積みボタン・上＝紫塗りの「編集を続ける」・下＝薄グレーの「破棄して閉じる」。
 */
export function DiscardChangesModal({ visible, onKeepEditing, onDiscard }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onKeepEditing}>
      <View style={styles.centerWrap}>
        <TouchableWithoutFeedback onPress={onKeepEditing}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.dialog}>
          <Text style={styles.title}>入力内容を破棄しますか？</Text>
          <Text style={styles.msg}>
            入力した内容は保存されていません。{'\n'}このまま閉じると、変更内容が失われます。
          </Text>
          <TouchableOpacity style={[styles.btn, styles.btnKeep]} onPress={onKeepEditing} accessibilityRole="button">
            <Text style={styles.btnKeepText}>編集を続ける</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnDiscard]} onPress={onDiscard} accessibilityRole="button">
            <Text style={styles.btnDiscardText}>破棄して閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerWrap: { flex: 1, justifyContent: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.42)' },
  dialog: {
    marginHorizontal: 28,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 48,
    elevation: 12,
  },
  title: { fontFamily: fonts.jakartaBold, fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  msg: { fontSize: 13, color: colors.text2, lineHeight: 20, marginBottom: 18 },
  btn: { alignItems: 'center', paddingVertical: 13, borderRadius: 12 },
  btnKeep: { backgroundColor: colors.accent, marginBottom: 8 },
  btnKeepText: { fontSize: 14, fontWeight: '700', color: colors.white },
  btnDiscard: { backgroundColor: colors.surface2 },
  btnDiscardText: { fontSize: 14, fontWeight: '700', color: colors.text2 },
});
