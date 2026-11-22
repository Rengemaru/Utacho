import Constants from 'expo-constants';
import { Stack, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { useConfirm } from '../src/components/ConfirmProvider';
import { TutorialModal } from '../src/components/TutorialModal';
import { TUTORIALS, CATEGORIES, type Tutorial } from '../src/data/tutorialContent';
import { getAllSongs } from '../src/db/songs';
import { requestTutorialReplay, type TutorialPartId } from '../src/lib/tutorial';

const REPLAYABLE_TUTORIALS: readonly {
  id: TutorialPartId;
  icon: string;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'intro',
    icon: '✨',
    title: 'はじめに（曲の探し方）',
    subtitle: '「さがす」からの曲検索・手入力での追加方法',
  },
  {
    id: 'home',
    icon: '🎤',
    title: 'ホームの使い方',
    subtitle: '点数記録・曲詳細・スワイプ編集・選曲ツール',
  },
  {
    id: 'detail',
    icon: '📊',
    title: '曲詳細の使い方',
    subtitle: 'DAM/JOYSOUND切替・キー・テンポ・メモ調整',
  },
];

const CONTACT_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf3TQNxt8K_TyOfBKiAt0Kty42A6T8TADIvLtAzhDy9htXHOQ/viewform';
const CONTACT_MAIL_URL = 'mailto:ren0304game@gmail.com';
const PRIVACY_URL = 'https://rengemaru.github.io/Utacho/privacy-policy.html';
const APP_VERSION =
  Constants.expoConfig?.version ?? (Constants as any).manifest?.version ?? '—';

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const confirm = useConfirm();
  const [selected, setSelected] = useState<Tutorial | null>(null);
  const replayingRef = useRef(false);

  async function handleReplayTutorial(part: TutorialPartId) {
    if (Platform.OS === 'web' || replayingRef.current) return;
    replayingRef.current = true;
    try {
      if (part === 'intro') {
        requestTutorialReplay('intro');
        router.navigate('/(tabs)');
        return;
      }

      const songs = getAllSongs();
      if (songs.length === 0) {
        const targetLabel = part === 'home' ? 'ホーム' : '曲詳細';
        await confirm({
          title: '曲がまだありません',
          message: `先に1曲追加すると、${targetLabel}のチュートリアルを再生できます。`,
          options: [{ label: 'OK', style: 'primary' }],
          cancelLabel: null,
        });
        return;
      }

      requestTutorialReplay(part);
      if (part === 'home') {
        router.navigate('/(tabs)');
      } else {
        router.replace(`/song/${songs[0].id}`);
      }
    } catch (e) {
      console.error(e);
      await confirm({
        title: 'エラー',
        message: 'チュートリアルの開始に失敗しました',
        options: [{ label: 'OK', style: 'primary' }],
        cancelLabel: null,
      });
    } finally {
      replayingRef.current = false;
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: '機能ガイド', headerBackTitle: '戻る' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          実際の画面で操作を体験できるチュートリアルや、「やりたいこと」別の図解ガイドを確認できます。
        </Text>

        {/* コーチマークの個別再再生 */}
        <View style={styles.group}>
          <Text style={styles.catLabel}>チュートリアル</Text>
          {REPLAYABLE_TUTORIALS.map((item) => (
            <Pressable
              key={item.id}
              style={styles.row}
              onPress={() => handleReplayTutorial(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}のチュートリアルを再生`}
            >
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>再生</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        {CATEGORIES.map((cat) => {
          const items = TUTORIALS.filter((t) => t.category === cat.key);
          if (items.length === 0) return null;
          return (
            <View key={cat.key} style={styles.group}>
              <Text style={styles.catLabel}>{cat.label}</Text>
              {items.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.row}
                  onPress={() => setSelected(t)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.title}のチュートリアルを開く`}
                >
                  <View style={styles.iconWrap}>
                    <Text style={styles.icon}>{t.icon}</Text>
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.title} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>{t.subtitle}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {t.steps.length > 1
                        ? `全${t.steps.length}手順`
                        : t.category === 'E'
                          ? '回答'
                          : t.category === 'F'
                            ? '対処'
                            : '図解'}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          );
        })}

        {/* お問い合わせ・アプリ情報（図解にできない外部リンク・バージョン） */}
        <View style={styles.group}>
          <Text style={styles.catLabel}>お問い合わせ・アプリ情報</Text>
          <Pressable
            style={styles.linkRow}
            onPress={() => Linking.openURL(CONTACT_FORM_URL)}
            accessibilityRole="link"
            accessibilityLabel="お問い合わせフォームを開く"
          >
            <View style={styles.iconWrap}><Text style={styles.icon}>✉️</Text></View>
            <Text style={styles.linkLabel}>お問い合わせフォーム</Text>
            <Text style={styles.chevron}>↗</Text>
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => Linking.openURL(CONTACT_MAIL_URL)}
            accessibilityRole="link"
            accessibilityLabel="メールで問い合わせる"
          >
            <View style={styles.iconWrap}><Text style={styles.icon}>📮</Text></View>
            <Text style={styles.linkLabel}>メールで問い合わせる</Text>
            <Text style={styles.chevron}>↗</Text>
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => Linking.openURL(PRIVACY_URL)}
            accessibilityRole="link"
            accessibilityLabel="プライバシーポリシーを開く"
          >
            <View style={styles.iconWrap}><Text style={styles.icon}>🔒</Text></View>
            <Text style={styles.linkLabel}>プライバシーポリシー</Text>
            <Text style={styles.chevron}>↗</Text>
          </Pressable>
          <View style={styles.versionRow}>
            <Text style={styles.versionText}>バージョン {APP_VERSION}</Text>
          </View>
        </View>
      </ScrollView>

      <TutorialModal
        visible={selected !== null}
        tutorial={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 10,
  },
  intro: {
    fontSize: 11,
    color: colors.text2,
    lineHeight: 17,
    marginBottom: 4,
  },
  group: {
    gap: 8,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 2,
    paddingLeft: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 15,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: colors.text3,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.accent,
  },
  chevron: {
    fontSize: 18,
    color: colors.text3,
    marginLeft: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  linkLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  versionRow: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  versionText: {
    fontSize: 11,
    color: colors.text3,
  },
});
