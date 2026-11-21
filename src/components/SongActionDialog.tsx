import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import type { SongWithStats } from '../types';

export interface SongActionTarget {
  song: SongWithStats;
  /** ユーザー作成カテゴリ内ならそのカテゴリ（id / name）、それ以外は null */
  category: { id: number; name: string } | null;
  /** 「今日」のセットリストタブ内かどうか */
  inSetlist: boolean;
}

interface Props {
  target: SongActionTarget | null;
  onClose: () => void;
  onEdit: () => void;
  onRemoveFromCategory: () => void;
  onRemoveFromSetlist: () => void;
  onDeleteSong: () => void;
}

// Figma 105:4918: 360×800 の画面で top: 190px 付近に配置されるメニュー
const FIGMA_CENTER_OFFSET = 18;

/**
 * 曲カード長押し時の操作メニュー（U09 #138 / Figma 105:4918 準拠）。
 * カテゴリ表示中は「このカテゴリから外す」を主操作（紫）として出し、
 * 「歌帳から削除…」（赤文字）との違いを注記で明確にする。
 */
export function SongActionDialog({
  target,
  onClose,
  onEdit,
  onRemoveFromCategory,
  onRemoveFromSetlist,
  onDeleteSong,
}: Props) {
  const song = target?.song ?? null;
  const category = target?.category ?? null;
  const inSetlist = target?.inSetlist ?? false;

  const subtitle = category
    ? `カテゴリ「${category.name}」の曲を操作`
    : inSetlist
      ? '今日のセットリストの曲を操作'
      : song?.artist || 'この曲を操作';

  return (
    <Modal
      visible={target !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.content} pointerEvents="box-none">
          <View style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.title} numberOfLines={2}>
              {song?.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.secondaryBtn}
              onPress={onEdit}
            >
              <Text style={styles.secondaryText}>曲を編集する</Text>
            </TouchableOpacity>

            {category && (
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.primaryBtn}
                onPress={onRemoveFromCategory}
              >
                <Text style={styles.primaryText}>このカテゴリから外す</Text>
              </TouchableOpacity>
            )}

            {inSetlist && (
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.primaryBtn}
                onPress={onRemoveFromSetlist}
              >
                <Text style={styles.primaryText}>今日から外す</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.dangerBtn}
              onPress={onDeleteSong}
            >
              <Text style={styles.dangerText}>歌帳から削除…</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.secondaryBtn}
              onPress={onClose}
            >
              <Text style={styles.secondaryText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
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
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 18,
    gap: 12,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  title: {
    fontFamily: fonts.notoSansJPBold,
    fontSize: 16,
    lineHeight: 20,
    includeFontPadding: false,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.notoSansJPRegular,
    fontSize: 12,
    lineHeight: 16,
    includeFontPadding: false,
    color: colors.text2,
  },
  primaryBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  primaryText: {
    fontFamily: fonts.notoSansJPBold,
    fontSize: 13,
    lineHeight: 16,
    includeFontPadding: false,
    color: colors.white,
    textAlign: 'center',
  },
  secondaryBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    fontFamily: fonts.notoSansJPBold,
    fontSize: 13,
    lineHeight: 16,
    includeFontPadding: false,
    color: colors.text2,
    textAlign: 'center',
  },
  dangerBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface2,
  },
  dangerText: {
    fontFamily: fonts.notoSansJPBold,
    fontSize: 13,
    lineHeight: 16,
    includeFontPadding: false,
    color: colors.red,
    textAlign: 'center',
  },
});
