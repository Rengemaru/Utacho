import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { TutorialIllustration } from './TutorialIllustration';
import type { Tutorial } from '../data/tutorialContent';

interface Props {
  visible: boolean;
  tutorial: Tutorial | null;
  onClose: () => void;
}

export function TutorialModal({ visible, tutorial, onClose }: Props) {
  const [step, setStep] = useState(0);

  // 開くたびに最初の手順へ戻す
  useEffect(() => {
    if (visible) setStep(0);
  }, [visible, tutorial?.id]);

  if (!tutorial) return null;

  const total = tutorial.steps.length;
  const current = tutorial.steps[Math.min(step, total - 1)];
  const isLast = step >= total - 1;

  const handleNext = () => {
    if (isLast) onClose();
    else setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step === 0) onClose();
    else setStep((s) => s - 1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.dots}>
            {tutorial.steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{current.emoji}</Text>
          </View>

          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.desc}>{current.desc}</Text>

          {current.illust ? (
            <View style={styles.illust}>
              <TutorialIllustration kind={current.illust} />
            </View>
          ) : null}

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={step === 0 ? '閉じる' : '前の手順へ戻る'}
            >
              <Text style={styles.backText}>{step === 0 ? '閉じる' : '‹ 戻る'}</Text>
            </TouchableOpacity>
            <View style={styles.counterWrap}>
              <Text style={styles.counter}>{step + 1} / {total}</Text>
            </View>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={isLast ? '完了' : '次の手順へ'}
            >
              <Text style={styles.nextText}>{isLast ? '完了' : '次へ ›'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 36, 48, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentSoft,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.accent,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 26,
  },
  title: {
    fontFamily: fonts.jakartaBold,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.text2,
    textAlign: 'center',
    marginBottom: 14,
  },
  illust: {
    width: '100%',
    marginBottom: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backText: {
    fontSize: 12,
    color: colors.text3,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  counterWrap: {
    flex: 1,
    alignItems: 'center',
  },
  counter: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.text3,
  },
  nextBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  nextText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});
