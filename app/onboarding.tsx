import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { fonts } from '../src/constants/fonts';
import { completeOnboarding, setDefaultMachine, type Machine } from '../src/lib/machine';
import { setSettingSync } from '../src/db/settings';
import { useMachine } from '../src/contexts/MachineContext';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { refresh } = useMachine();
  const [selected, setSelected] = useState<Machine>('DAM');

  async function finishOnboarding(machine: Machine) {
    await setDefaultMachine(machine);
    await completeOnboarding();
    setSettingSync('first_launch_guide', 'pending'); // Onb-1: 初回登録ガイドを表示するフラグ
    await refresh();
    router.replace('/(tabs)');
  }

  async function handleStart() {
    await finishOnboarding(selected);
  }

  // 機種を今決めたくない人向け。デフォルトはDAMで開始し、あとから設定で変更できる
  async function handleLater() {
    await finishOnboarding('DAM');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.logoSection}>
        <Text style={styles.logo}>歌帳</Text>
        <Text style={styles.welcome}>ようこそ！</Text>
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.question}>いつもどちらで{'\n'}歌いますか？</Text>
        <Text style={styles.questionSub}>
          普段使う機種を選んでください。{'\n'}あとから設定画面で変更できます。
        </Text>
      </View>

      <View style={styles.machineList}>
        {(['DAM', 'JOYSOUND'] as Machine[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.machineCard,
              selected === m && (m === 'DAM' ? styles.machineCardDam : styles.machineCardJoy),
            ]}
            onPress={() => setSelected(m)}
          >
            <View style={[styles.machineIcon, m === 'DAM' ? styles.iconDam : styles.iconJoy]}>
              <Text style={[styles.machineIconText, { color: m === 'DAM' ? colors.dam : colors.joy }]}>
                {m === 'DAM' ? 'D' : 'J'}
              </Text>
            </View>
            <View style={styles.machineText}>
              <Text style={styles.machineName}>{m}</Text>
              <Text style={styles.machineDesc}>
                {m === 'DAM' ? '第一興商の精密採点' : 'エクシングの分析採点マスター'}
              </Text>
            </View>
            <View style={[
              styles.machineCheck,
              selected === m ? (m === 'DAM' ? styles.checkDam : styles.checkJoy) : styles.checkUnchecked,
            ]}>
              {selected === m && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.btnWrap}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>はじめる</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.laterBtn} onPress={handleLater}>
          <Text style={styles.laterBtnText}>あとで決める（DAMで始める）</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  logoSection: {
    paddingTop: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 28,
    color: colors.accent,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcome: {
    fontSize: 11,
    color: colors.text2,
    letterSpacing: 0.5,
  },
  questionSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  question: {
    fontFamily: fonts.jakartaBold,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8,
  },
  questionSub: {
    fontSize: 11,
    color: colors.text2,
    lineHeight: 18,
    textAlign: 'center',
  },
  machineList: {
    paddingHorizontal: 18,
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  machineCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  machineCardDam: {
    borderColor: colors.dam,
    backgroundColor: colors.damSoft,
  },
  machineCardJoy: {
    borderColor: colors.joy,
    backgroundColor: colors.joySoft,
  },
  machineIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDam: { backgroundColor: colors.damSoft },
  iconJoy: { backgroundColor: colors.joySoft },
  machineIconText: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 18,
  },
  machineText: { flex: 1 },
  machineName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  machineDesc: {
    fontSize: 10,
    color: colors.text2,
    marginTop: 2,
  },
  machineCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDam: { backgroundColor: colors.dam },
  checkJoy: { backgroundColor: colors.joy },
  checkUnchecked: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  checkMark: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },
  btnWrap: {
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  laterBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  laterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text2,
  },
});
