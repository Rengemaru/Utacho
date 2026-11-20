import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { fonts } from '../src/constants/fonts';
import { HELP_SECTIONS, HelpEntry } from '../src/data/helpContent';

function AppVersionRow() {
  const version =
    Constants.expoConfig?.version ??
    (Constants as any).manifest?.version ??
    '—';
  return <Text style={styles.versionText}>バージョン {version}</Text>;
}

function EntryRow({ entry, isLast }: { entry: HelpEntry; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.entry, isLast && styles.entryLast]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={entry.heading}
        style={styles.entryHeader}
      >
        <Text style={styles.entryHeading}>{entry.heading}</Text>
        <Text style={styles.toggle}>{open ? '▲' : '＋'}</Text>
      </Pressable>

      {open && (
        <View style={styles.entryBody}>
          {entry.body.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}

          {entry.links?.map((link) => (
            <Pressable
              key={link.url}
              onPress={() => Linking.openURL(link.url)}
              accessibilityRole="link"
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>{link.label}</Text>
            </Pressable>
          ))}

          {entry.showAppVersion && <AppVersionRow />}
        </View>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'ヘルプ', headerBackTitle: '戻る' }} />
      <ScrollView
        style={[styles.screen, { paddingTop: insets.top > 0 ? 0 : 8 }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.guideBanner}
          onPress={() => router.push('/guide')}
          accessibilityRole="button"
          accessibilityLabel="機能ガイドのチュートリアルを開く"
        >
          <Text style={styles.guideBannerIcon}>📘</Text>
          <View style={styles.guideBannerBody}>
            <Text style={styles.guideBannerTitle}>機能ガイド（チュートリアル）</Text>
            <Text style={styles.guideBannerSub}>使い方を機能ごとに手順つきで見る</Text>
          </View>
          <Text style={styles.guideBannerChevron}>›</Text>
        </Pressable>

        {HELP_SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.group}>
              {section.entries.map((entry, i) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  isLast={i === section.entries.length - 1}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
    gap: 20,
  },
  guideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.accentSoft,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  guideBannerIcon: {
    fontSize: 22,
  },
  guideBannerBody: {
    flex: 1,
    minWidth: 0,
  },
  guideBannerTitle: {
    fontFamily: fonts.jakartaBold,
    fontSize: 14,
    color: colors.accent,
    marginBottom: 2,
  },
  guideBannerSub: {
    fontSize: 11,
    color: colors.text2,
  },
  guideBannerChevron: {
    fontSize: 20,
    color: colors.accent,
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
  entry: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryLast: {
    borderBottomWidth: 0,
  },
  entryHeader: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryHeading: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    paddingRight: 12,
  },
  toggle: {
    fontSize: 14,
    color: colors.accent,
    width: 20,
    textAlign: 'center',
  },
  entryBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text2,
    marginBottom: 6,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  versionText: {
    fontSize: 13,
    color: colors.text3,
  },
});
