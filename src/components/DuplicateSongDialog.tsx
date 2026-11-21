import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import type { SongRow } from '../types';

interface Props {
  song: Pick<SongRow, 'id' | 'title' | 'artist'> | null;
  isEdit: boolean;
  onCancel: () => void;
  onOpenExisting: () => void;
  onSaveSeparate: () => void;
}

// Figma 105:2067: 360×800の画面で、ダイアログの中心は画面中央より38.5px上。
const FIGMA_CENTER_OFFSET = 38.5;

/** U08 / Figma 105:1995の2ボタンダイアログ。 */
export function DuplicateSongDialog({ song, isEdit, onCancel, onOpenExisting, onSaveSeparate }: Props) {
  return (
    <Modal visible={song !== null} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onCancel}>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.content} pointerEvents="box-none">
          <View style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.title}>この曲は登録済みです</Text>
            <ScrollView style={styles.messageScroll} bounces={false}>
              <Text style={styles.message}>
                {song?.title}{song?.artist ? ` ／ ${song.artist}` : ''}{'\n'}
                {isEdit
                  ? '入力中の変更は保存せず、登録済みの曲を開きます。'
                  : '登録済みの曲で点数やメモを記録できます。'}
              </Text>
            </ScrollView>
            <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={onOpenExisting}>
              <Text style={styles.primaryText}>登録済みの曲を開く</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={onSaveSeparate}>
              <Text style={styles.secondaryText}>{isEdit ? 'この曲の変更を保存する' : '別の曲として登録する'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.42)' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: FIGMA_CENTER_OFFSET * 2,
  },
  dialog: {
    width: '100%',
    maxWidth: 304,
    maxHeight: '100%',
    paddingHorizontal: 18,
    paddingVertical: 22,
    gap: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  title: { fontFamily: fonts.notoSansJPBold, fontSize: 16, lineHeight: 19, includeFontPadding: false, color: colors.text },
  messageScroll: { flexGrow: 0, flexShrink: 1 },
  message: { fontFamily: fonts.notoSansJPRegular, fontSize: 13, lineHeight: 16, includeFontPadding: false, color: colors.text2 },
  primary: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: colors.accent },
  primaryText: { fontFamily: fonts.notoSansJPBold, fontSize: 13, lineHeight: 16, includeFontPadding: false, color: colors.white, textAlign: 'center' },
  secondary: { minHeight: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: colors.surface2 },
  secondaryText: { fontFamily: fonts.notoSansJPBold, fontSize: 13, lineHeight: 16, includeFontPadding: false, color: colors.text2, textAlign: 'center' },
});
