import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { getDefaultMachine, type Machine } from '../../src/lib/machine';
import { exportBackup, readBackupFile, restoreFromBackup } from '../../src/lib/backup';
import { deleteAllData } from '../../src/db/maintenance';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [defaultMachine, setDefaultMachineState] = useState<Machine>('DAM');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'web') return;
    getDefaultMachine().then(setDefaultMachineState);
  }, []));

  async function handleExportBackup() {
    if (Platform.OS === 'web') {
      Alert.alert('非対応', 'バックアップはモバイル端末でのみ使用できます');
      return;
    }
    try {
      setIsExporting(true);
      await exportBackup();
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', 'バックアップの書き出しに失敗しました');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportBackup() {
    if (Platform.OS === 'web') {
      Alert.alert('非対応', 'バックアップの読み込みはモバイル端末でのみ使用できます');
      return;
    }
    try {
      setIsImporting(true);
      const data = await readBackupFile();
      if (!data) return;

      const summary = `タブ ${data.tabs.length}件・曲 ${data.songs.length}件・スコア ${data.scores.length}件`;
      Alert.alert(
        'バックアップを読み込みますか？',
        `${summary}\n\n現在のデータはすべて上書きされます。この操作は取り消せません。`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '読み込む',
            style: 'destructive',
            onPress: () => {
              try {
                restoreFromBackup(data);
                Alert.alert('完了', 'バックアップを復元しました');
              } catch (e) {
                console.error(e);
                Alert.alert('エラー', '復元に失敗しました');
              }
            },
          },
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', e instanceof Error ? e.message : 'ファイルの読み込みに失敗しました');
    } finally {
      setIsImporting(false);
    }
  }

  function runDeleteAll() {
    if (Platform.OS === 'web') {
      Alert.alert('完了', 'すべてのデータを削除しました');
      return;
    }
    try {
      deleteAllData();
      Alert.alert('完了', 'すべてのデータを削除しました');
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '削除に失敗しました');
    }
  }

  async function handleBackupThenDelete() {
    if (Platform.OS === 'web') {
      runDeleteAll();
      return;
    }
    try {
      setIsExporting(true);
      await exportBackup();
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', 'バックアップに失敗したため削除を中止しました');
      return;
    } finally {
      setIsExporting(false);
    }
    runDeleteAll();
  }

  function handleDeleteAll() {
    Alert.alert(
      'すべてのデータを削除',
      'この操作は取り消せません。削除前にバックアップを取ることをおすすめします。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'バックアップして削除', onPress: handleBackupThenDelete },
        { text: 'そのまま削除', style: 'destructive', onPress: runDeleteAll },
      ]
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* タブ管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>タブ管理</Text>
          <View style={styles.group}>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/tabs')}>
              <View style={[styles.rowIcon, styles.iconPurple]}>
                <Text style={styles.rowEmoji}>🗂</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>タブを編集する</Text>
                <Text style={styles.rowSub}>追加・名前変更・削除・並び替え</Text>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* カラオケ機種 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>カラオケ機種</Text>
          <View style={styles.group}>
            <TouchableOpacity
              style={[styles.row, styles.rowNoBorder]}
              onPress={() => router.push('/settings/machine')}
            >
              <View style={[styles.rowIcon, styles.iconDam]}>
                <Text style={styles.rowEmoji}>🎤</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>デフォルト機種</Text>
                <Text style={styles.rowSub}>点数記録時にプリセットされる機種</Text>
              </View>
              <Text style={[
                styles.rowValue,
                { color: defaultMachine === 'DAM' ? colors.dam : colors.joy },
              ]}>
                {defaultMachine}
              </Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* データ管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>データ管理</Text>
          <View style={styles.group}>
            <TouchableOpacity
              style={styles.row}
              onPress={handleExportBackup}
              disabled={isExporting}
            >
              <View style={[styles.rowIcon, styles.iconPurple]}>
                <Text style={styles.rowEmoji}>💾</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>バックアップを書き出す</Text>
                <Text style={styles.rowSub}>全データをJSONファイルで書き出す</Text>
              </View>
              {isExporting
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Text style={styles.rowChevron}>›</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.row}
              onPress={handleImportBackup}
              disabled={isImporting}
            >
              <View style={[styles.rowIcon, styles.iconGreen]}>
                <Text style={styles.rowEmoji}>📂</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>バックアップを読み込む</Text>
                <Text style={styles.rowSub}>JSONファイルから全データを復元する</Text>
              </View>
              {isImporting
                ? <ActivityIndicator size="small" color={colors.green} />
                : <Text style={styles.rowChevron}>›</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={[styles.row, styles.rowNoBorder]} onPress={handleDeleteAll}>
              <View style={[styles.rowIcon, styles.iconRed]}>
                <Text style={styles.rowEmoji}>🗑</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.dangerLabel}>すべてのデータを削除</Text>
                <Text style={styles.rowSub}>この操作は取り消せません</Text>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ヘルプ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>サポート</Text>
          <View style={styles.group}>
            <TouchableOpacity
              style={[styles.row, styles.rowNoBorder]}
              onPress={() => router.push('/help')}
            >
              <View style={[styles.rowIcon, styles.iconPurple]}>
                <Text style={styles.rowEmoji}>❓</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>ヘルプ</Text>
                <Text style={styles.rowSub}>使い方・よくある質問・お問い合わせ</Text>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* アプリ情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>アプリ情報</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, styles.iconGray]}>
                <Text style={styles.rowEmoji}>ℹ️</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>バージョン</Text>
              </View>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL('https://rengemaru.github.io/Utacho/terms-of-use.html')}
            >
              <View style={[styles.rowIcon, styles.iconGray]}>
                <Text style={styles.rowEmoji}>📋</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>利用規約</Text>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowNoBorder]}
              onPress={() => Linking.openURL('https://rengemaru.github.io/Utacho/privacy-policy.html')}
            >
              <View style={[styles.rowIcon, styles.iconGray]}>
                <Text style={styles.rowEmoji}>📄</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>プライバシーポリシー</Text>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  title: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 20,
    letterSpacing: -0.2,
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: 18,
    gap: 20,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.text3,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingLeft: 2,
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
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconPurple: { backgroundColor: colors.accentSoft },
  iconGreen: { backgroundColor: 'rgba(0, 185, 107, 0.1)' },
  iconRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  iconGray: { backgroundColor: colors.surface2 },
  iconDam: { backgroundColor: colors.damSoft },
  rowEmoji: { fontSize: 15 },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  rowSub: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 1,
  },
  rowChevron: {
    fontSize: 18,
    color: colors.text3,
  },
  rowValue: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '500',
    marginRight: 4,
  },
  dangerLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.red,
  },
});
