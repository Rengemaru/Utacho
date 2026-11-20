// コーチマーク1枚分の表示。画面を暗くし、対象の部分だけ穴をあけて吹き出しで説明する。
// target が null のときは画面中央の「ようこそ」カードを出す。
// 進行（どのステップを出すか・位置の計測）は CoachMarkTour が担当する。

import { useState } from 'react';
import { LayoutChangeEvent, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import type { CoachRect } from '../lib/coachTargets';

const SCRIM_COLOR = 'rgba(10, 10, 31, 0.62)';
const TOOLTIP_WIDTH = 288;
const SIDE_MARGIN = 16;
const RING_GAP = 3;     // 穴と点線リングの間
const ARROW_H = 10;     // 吹き出しの矢印の高さ
const ARROW_W = 18;

export type CoachHole = CoachRect & { shape: 'rect' | 'circle'; radius: number };

interface Props {
  visible: boolean;
  /** false の間は中身を出さない（次のステップの位置を計測中など）。モーダルは開いたまま */
  ready: boolean;
  hole: CoachHole | null;
  title: string;
  body: string;
  /** 「はじめに  1 / 3」のような見出し。ようこそカードでは未使用 */
  stepText?: string;
  dotIndex?: number;
  dotTotal?: number;
  nextLabel: string;
  onNext: () => void;
  onBack?: () => void;
  onSkip: () => void;
}

/** 外側の四角から角丸四角（または円）をくり抜くパス（evenodd で穴になる） */
function scrimPath(w: number, h: number, hole: CoachHole): string {
  const outer = `M0 0H${w}V${h}H0Z`;
  const { x, y, width, height } = hole;
  if (hole.shape === 'circle') {
    const r = Math.max(width, height) / 2;
    const cx = x + width / 2;
    const cy = y + height / 2;
    return `${outer}M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
  }
  const r = Math.min(hole.radius, width / 2, height / 2);
  return (
    `${outer}M${x + r} ${y}H${x + width - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + height - r}` +
    `a${r} ${r} 0 0 1 ${-r} ${r}H${x + r}a${r} ${r} 0 0 1 ${-r} ${-r}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}Z`
  );
}

export function CoachMarkOverlay({
  visible, ready, hole, title, body, stepText, dotIndex = 0, dotTotal = 0, nextLabel, onNext, onBack, onSkip,
}: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onSkip}>
      <View style={StyleSheet.absoluteFill} onLayout={handleLayout}>
        {!ready ? null : size && hole ? (
          <Spotlight
            size={size}
            hole={hole}
            title={title}
            body={body}
            stepText={stepText}
            dotIndex={dotIndex}
            dotTotal={dotTotal}
            nextLabel={nextLabel}
            onNext={onNext}
            onBack={onBack}
            onSkip={onSkip}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.welcomeWrap]}>
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeEmoji}>🎤</Text>
              <Text style={styles.welcomeTitle}>{title}</Text>
              <Text style={styles.welcomeBody}>{body}</Text>
              <TouchableOpacity style={styles.welcomePrimary} onPress={onNext} accessibilityRole="button">
                <Text style={styles.welcomePrimaryText}>{nextLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.welcomeSkip} onPress={onSkip} accessibilityRole="button">
                <Text style={styles.welcomeSkipText}>スキップ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function Spotlight({
  size, hole, title, body, stepText, dotIndex, dotTotal, nextLabel, onNext, onBack, onSkip,
}: {
  size: { w: number; h: number };
  hole: CoachHole;
  title: string;
  body: string;
  stepText?: string;
  dotIndex: number;
  dotTotal: number;
  nextLabel: string;
  onNext: () => void;
  onBack?: () => void;
  onSkip: () => void;
}) {
  const { w, h } = size;
  const centerX = hole.x + hole.width / 2;
  const centerY = hole.y + hole.height / 2;
  // 対象が画面の下半分なら吹き出しを上に、上半分なら下に出す
  const above = centerY > h / 2;
  const tooltipLeft = Math.max(SIDE_MARGIN, Math.min(w - SIDE_MARGIN - TOOLTIP_WIDTH, centerX - TOOLTIP_WIDTH / 2));
  const arrowLeft = Math.max(tooltipLeft + 16, Math.min(tooltipLeft + TOOLTIP_WIDTH - 16 - ARROW_W, centerX - ARROW_W / 2));
  const holeTop = hole.shape === 'circle' ? centerY - Math.max(hole.width, hole.height) / 2 : hole.y;
  const holeBottom = hole.shape === 'circle' ? centerY + Math.max(hole.width, hole.height) / 2 : hole.y + hole.height;
  // 矢印の先端がリングの少し外に来る位置
  const arrowTop = above ? holeTop - RING_GAP - 4 - ARROW_H : holeBottom + RING_GAP + 4;
  const tooltipPos = above ? { bottom: h - arrowTop + 1 } : { top: arrowTop + ARROW_H - 1 };
  const ringR = hole.shape === 'circle' ? Math.max(hole.width, hole.height) / 2 + RING_GAP : hole.radius + RING_GAP;

  return (
    <>
      {/* 暗幕（穴あき）。穴の部分のタップは吸収して誤操作を防ぐ */}
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Path d={scrimPath(w, h, hole)} fill={SCRIM_COLOR} fillRule="evenodd" />
        {hole.shape === 'circle' ? (
          <Rect
            x={centerX - ringR}
            y={centerY - ringR}
            width={ringR * 2}
            height={ringR * 2}
            rx={ringR}
            fill="none"
            stroke={colors.white}
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        ) : (
          <Rect
            x={hole.x - RING_GAP}
            y={hole.y - RING_GAP}
            width={hole.width + RING_GAP * 2}
            height={hole.height + RING_GAP * 2}
            rx={ringR}
            fill="none"
            stroke={colors.white}
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        )}
        <Path
          d={above
            ? `M${arrowLeft} ${arrowTop}H${arrowLeft + ARROW_W}L${arrowLeft + ARROW_W / 2} ${arrowTop + ARROW_H}Z`
            : `M${arrowLeft} ${arrowTop + ARROW_H}H${arrowLeft + ARROW_W}L${arrowLeft + ARROW_W / 2} ${arrowTop}Z`}
          fill={colors.white}
        />
      </Svg>

      <View style={[styles.tooltip, { left: tooltipLeft }, tooltipPos]}>
        <View style={styles.topRow}>
          <Text style={styles.stepText}>{stepText}</Text>
          <TouchableOpacity onPress={onSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button">
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <View style={styles.bottomRow}>
          <View style={styles.dots}>
            {Array.from({ length: dotTotal }, (_, i) => (
              <View key={i} style={[styles.dot, i === dotIndex && styles.dotActive]} />
            ))}
          </View>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityRole="button">
              <Text style={styles.backText}>戻る</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={onNext} accessibilityRole="button">
            <Text style={styles.nextText}>{nextLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    width: TOOLTIP_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepText: { fontFamily: fonts.monoMedium, fontSize: 10, color: colors.accent, letterSpacing: 0.5 },
  skipText: { fontSize: 11, color: colors.text3 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { fontSize: 12, lineHeight: 19, color: colors.text2 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 6, gap: 4 },
  dots: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.surface2 },
  dotActive: { width: 16, backgroundColor: colors.accent },
  backBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  backText: { fontSize: 12, fontWeight: '700', color: colors.text3 },
  nextBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  nextText: { fontSize: 12, fontWeight: '700', color: colors.white },

  welcomeWrap: { backgroundColor: SCRIM_COLOR, justifyContent: 'center', paddingHorizontal: 28 },
  welcomeCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  welcomeEmoji: { fontSize: 44 },
  welcomeTitle: { fontFamily: fonts.jakartaBold, fontSize: 19, color: colors.text, textAlign: 'center' },
  welcomeBody: { fontSize: 13, lineHeight: 20, color: colors.text2, textAlign: 'center' },
  welcomePrimary: {
    alignSelf: 'stretch',
    marginTop: 6,
    backgroundColor: colors.accent,
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
  },
  welcomePrimaryText: { fontSize: 14, fontWeight: '700', color: colors.white },
  welcomeSkip: { paddingVertical: 8, paddingHorizontal: 24 },
  welcomeSkipText: { fontSize: 13, color: colors.text3 },
});
