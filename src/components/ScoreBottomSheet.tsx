import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { insertScore, updateScore } from '../db/scores';
import { ScoreRow, SongWithStats } from '../types';
import { useMachine } from '../contexts/MachineContext';
import type { Machine } from '../lib/machine';
import {
  formatDateTime,
  nowDateTimeString,
  datePartOf,
  shiftDatePart,
  isFutureDatePart,
  todayDateString,
} from '../lib/datetime';

const MAX_SCORE = 100;

interface Props {
  visible: boolean;
  song: SongWithStats;
  editingScore: ScoreRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ScoreBottomSheet({ visible, song, editingScore, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { currentMachine, setCurrentMachine } = useMachine();
  const [input, setInput] = useState('');
  const [machine, setMachine] = useState<Machine>(currentMachine);
  const [scoredAt, setScoredAt] = useState<string>(nowDateTimeString());
  const [pbScore, setPbScore] = useState<number | null>(null);
  const pbAnim = useRef(new Animated.Value(0)).current;
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingScore) {
        setInput(String(editingScore.score));
        setMachine((editingScore.machine as Machine) || currentMachine);
        setScoredAt(editingScore.scored_at);
      } else {
        setInput('');
        setMachine(currentMachine);
        setScoredAt(nowDateTimeString());
      }
    }
  }, [visible, editingScore, currentMachine]);

  function handleKey(key: string) {
    if (key === '⌫') {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (input === '' || input.includes('.')) return;
      setInput((prev) => prev + '.');
      return;
    }
    const next = input + key;
    if (parseFloat(next) > MAX_SCORE) return;
    if (next.includes('.') && next.split('.')[1].length > 3) return;
    setInput(next);
  }

  function showPBBanner(score: number) {
    setPbScore(score);
    pbAnim.setValue(0);
    Animated.sequence([
      Animated.spring(pbAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
      Animated.delay(1400),
      Animated.timing(pbAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setPbScore(null);
      setIsSaving(false); // Bug-4: PBバナー終了後にリセット（finallyより遅らせる）
      onSaved();
    });
  }

  async function handleSave() {
    if (isSaving) return;
    const score = parseFloat(input);
    if (isNaN(score) || score < 0 || score > MAX_SCORE) {
      Alert.alert('入力エラー', '0〜100の数値を入力してください');
      return;
    }
    if (Platform.OS === 'web') {
      onSaved();
      return;
    }
    let pbTriggered = false;
    try {
      setIsSaving(true);
      if (editingScore) {
        updateScore(editingScore.id, score, machine, scoredAt);
        onSaved();
      } else {
        await setCurrentMachine(machine);
        insertScore(song.id, score, scoredAt, machine);
        const isNewPB = song.best_score === null || score > song.best_score;
        if (isNewPB) {
          pbTriggered = true; // finally での isSaving リセットをスキップ
          showPBBanner(score);
        } else {
          onSaved();
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      if (!pbTriggered) setIsSaving(false);
    }
  }

  const isEdit = !!editingScore;
  const nextDayIsFuture = isFutureDatePart(shiftDatePart(scoredAt, 1));
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />

        <Text style={styles.title}>
          {isEdit ? '点数を編集する' : '点数を記録する'}
        </Text>
        <Text style={styles.subtitle}>
          {song.title} ／ {song.artist || '—'}
          {isEdit ? ` ／ ${formatDateTime(editingScore.scored_at)}` : ''}
        </Text>

        {/* スコア表示 */}
        <View style={styles.scoreDisplay}>
          <Text style={styles.scoreNum}>{input || '0'}</Text>
          <Text style={styles.scoreUnit}>点</Text>
        </View>

        {/* 機種トグル */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>機種</Text>
          <View style={styles.toggleBtns}>
            {(['DAM', 'JOYSOUND'] as Machine[]).map((m) => {
              const isSelected = machine === m;
              const machineColor = m === 'DAM' ? colors.dam : colors.joy;
              return (
                <TouchableOpacity
                  key={m}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`機種 ${m}${isSelected ? '（選択中）' : ''}`}
                  style={[
                    styles.toggleBtn,
                    isSelected && (m === 'DAM' ? styles.toggleBtnDam : styles.toggleBtnJoy),
                  ]}
                  onPress={() => setMachine(m)}
                >
                  {isSelected ? (
                    <Text style={[styles.toggleCheck, { color: machineColor }]}>✓</Text>
                  ) : (
                    <View style={[styles.toggleDot, { backgroundColor: machineColor }]} />
                  )}
                  <Text style={[
                    styles.toggleBtnText,
                    isSelected && { color: machineColor, fontWeight: '700' },
                  ]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <Text style={styles.sessionHint}>
          {isEdit
            ? '※ 既存記録の機種を表示。変更してもセッションには影響しない'
            : '※ 今日中はこの機種が記憶されます'}
        </Text>

        {/* テンキー */}
        <View style={styles.numpad}>
          {KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.numKey}
              onPress={() => handleKey(key)}
            >
              <Text style={[styles.numKeyText, key === '⌫' && styles.delKeyText]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 記録日ステッパー（未来日は選べない） */}
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>記録日</Text>
          <View style={styles.dateStepper}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setScoredAt((s) => shiftDatePart(s, -1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.dateBtnText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.dateValueWrap}>
              <Text style={styles.dateValue}>{formatDateTime(datePartOf(scoredAt))}</Text>
              {datePartOf(scoredAt) === todayDateString() && (
                <Text style={styles.dateTodayTag}>今日</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.dateBtn, nextDayIsFuture && styles.dateBtnDisabled]}
              onPress={() => setScoredAt((s) => (isFutureDatePart(shiftDatePart(s, 1)) ? s : shiftDatePart(s, 1)))}
              disabled={nextDayIsFuture}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.dateBtnText, nextDayIsFuture && styles.dateBtnTextDisabled]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 保存ボタン */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.saveBtnText}>{isEdit ? '変更を保存する' : '記録する'}</Text>
          }
        </TouchableOpacity>

        {/* 自己ベスト更新バナー */}
        {pbScore !== null && (
          <Animated.View
            style={[
              styles.pbBanner,
              {
                opacity: pbAnim,
                transform: [{ scale: pbAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              },
            ]}
          >
            <Text style={styles.pbEmoji}>🎉</Text>
            <View>
              <Text style={styles.pbTitle}>自己ベスト更新！</Text>
              <Text style={styles.pbScore}>{pbScore.toFixed(3)} 点</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.text2,
    marginBottom: 13,
  },
  scoreDisplay: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 9,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  scoreNum: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 28,
    color: colors.accent,
    letterSpacing: -0.4,
  },
  scoreUnit: {
    fontSize: 12,
    color: colors.text2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  toggleLabel: {
    fontSize: 10,
    color: colors.text2,
    fontWeight: '500',
    letterSpacing: 0.5,
    minWidth: 32,
  },
  toggleBtns: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleBtnDam: {
    backgroundColor: colors.damSoft,
    borderColor: colors.dam,
    borderWidth: 2,
  },
  toggleBtnJoy: {
    backgroundColor: colors.joySoft,
    borderColor: colors.joy,
    borderWidth: 2,
  },
  toggleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  toggleCheck: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text2,
  },
  sessionHint: {
    fontSize: 9,
    color: colors.text3,
    marginBottom: 9,
    paddingLeft: 2,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 9,
  },
  numKey: {
    width: '30%',
    flexGrow: 1,
    height: 36,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  delKeyText: {
    fontSize: 13,
    color: colors.text2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 11,
  },
  dateLabel: {
    fontSize: 10,
    color: colors.text2,
    fontWeight: '500',
    letterSpacing: 0.5,
    minWidth: 32,
  },
  dateStepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
  },
  dateBtn: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnDisabled: {
    opacity: 0.35,
  },
  dateBtnText: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: '700',
  },
  dateBtnTextDisabled: {
    color: colors.text3,
  },
  dateValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  dateTodayTag: {
    fontSize: 9,
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  pbBanner: {
    position: 'absolute',
    bottom: 80,
    left: 18,
    right: 18,
    backgroundColor: colors.green,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  pbEmoji: {
    fontSize: 28,
  },
  pbTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  pbScore: {
    fontFamily: fonts.monoMedium,
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.5,
  },
});
