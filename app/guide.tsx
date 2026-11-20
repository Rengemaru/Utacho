import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { fonts } from '../src/constants/fonts';
import { TutorialModal } from '../src/components/TutorialModal';
import { TUTORIALS, CATEGORIES, type Tutorial } from '../src/data/tutorialContent';

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Tutorial | null>(null);

  return (
    <>
      <Stack.Screen options={{ title: '機能ガイド', headerBackTitle: '戻る' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          「やりたいこと」から選べます。項目をタップすると、手順にそったチュートリアルが開きます。
        </Text>

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
                    <Text style={styles.badgeText}>全{t.steps.length}手順</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          );
        })}
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
});
