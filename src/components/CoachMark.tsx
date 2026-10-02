import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function CoachMark({ visible, onDismiss }: Props) {
  if (!visible) return <View style={{ height: 0 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>💡 使い方</Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.steps}>
          <View style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>＋</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepLabel}>曲を登録する</Text>
              <Text style={styles.stepDesc}>右上の ＋ ボタンをタップ</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>🎤</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepLabel}>点数を記録する</Text>
              <Text style={styles.stepDesc}>曲カードの 🎤 アイコンをタップ</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>👈</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepLabel}>編集・削除する</Text>
              <Text style={styles.stepDesc}>曲カードを左にスワイプ</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>📈</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepLabel}>推移を確認する</Text>
              <Text style={styles.stepDesc}>曲カードをタップして詳細を開く</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
          <Text style={styles.dismissBtnText}>わかった！</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.2)',
    padding: 16,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.jakartaBold,
    fontSize: 13,
    color: colors.accent,
  },
  closeIcon: {
    fontSize: 13,
    color: colors.text3,
  },
  steps: {
    gap: 0,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconText: {
    fontSize: 16,
  },
  stepBody: { flex: 1 },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  stepDesc: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
  dismissBtn: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
});
