// コーチマークのツアー（ステップ送り）。各ステップの対象の位置を測り、CoachMarkOverlay で表示する。
// 対象が見つからない（非表示など）ステップは飛ばす。
// 表示は CoachMarkProvider（src/contexts/CoachMarkContext.tsx）がアプリの最前面に重ねる。

import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import type { CoachPart, CoachStep } from '../data/tutorialSteps';
import { measureCoachTarget } from '../lib/coachTargets';
import { CoachHole, CoachMarkOverlay } from './CoachMarkOverlay';

const DEFAULT_PADDING = 6;
const DEFAULT_RADIUS = 14;
const MEASURE_RETRIES = 5;
const MEASURE_INTERVAL_MS = 120;

export type CoachTourResult = 'done' | 'skipped';
export type CoachOrigin = { x: number; y: number };

interface Props {
  part: CoachPart | null;
  onFinish: (result: CoachTourResult) => void;
  /** ステップ表示前の準備（対象が見えるようにスクロールする等） */
  onBeforeStep?: (step: CoachStep) => Promise<void>;
  /** 重ねる領域のウィンドウ上の位置（対象の座標をこの基準に直す） */
  getOrigin: () => Promise<CoachOrigin>;
  /** 重ねる領域の大きさ */
  size: { w: number; h: number };
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// 対象もオーバーレイも同じウィンドウ上で measureInWindow し、差をとって重ねる領域の座標に直す
async function measureWithRetry(step: CoachStep, getOrigin: () => Promise<CoachOrigin>): Promise<CoachHole | null> {
  if (!step.target) return null;
  for (let i = 0; i < MEASURE_RETRIES; i++) {
    const [rect, origin] = await Promise.all([measureCoachTarget(step.target), getOrigin()]);
    if (rect) {
      const pad = step.padding ?? DEFAULT_PADDING;
      return {
        x: rect.x - origin.x - pad,
        y: rect.y - origin.y - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        shape: step.shape ?? 'rect',
        radius: step.radius ?? DEFAULT_RADIUS,
      };
    }
    await wait(MEASURE_INTERVAL_MS);
  }
  return null;
}

export function CoachMarkTour(props: Props) {
  const { part } = props;
  if (!part) return null;
  // パートが変わったら作り直して先頭のステップから始める
  return <Tour key={`${part.label}:${part.steps[0]?.title ?? ''}`} {...props} part={part} />;
}

function Tour({ part, onFinish, onBeforeStep, getOrigin, size }: Props & { part: CoachPart }) {
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState<CoachHole | null>(null);
  const [ready, setReady] = useState(false);

  const step = part.steps[index] ?? null;

  // Android の戻るボタンはスキップ扱い（下の画面を戻さない）
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onFinish('skipped');
      return true;
    });
    return () => sub.remove();
  }, [onFinish]);

  useEffect(() => {
    if (!step) return;
    let canceled = false;
    setReady(false);
    (async () => {
      if (!step.target) {
        setHole(null);
        setReady(true);
        return;
      }
      if (onBeforeStep) await onBeforeStep(step);
      const measured = await measureWithRetry(step, getOrigin);
      if (canceled) return;
      if (!measured) {
        // 対象が無いステップは飛ばす（最後なら終了）
        if (index + 1 < part.steps.length) setIndex(index + 1);
        else onFinish('done');
        return;
      }
      setHole(measured);
      setReady(true);
    })();
    return () => { canceled = true; };
    // onBeforeStep / onFinish は呼び出し側で毎回作られても再計測しない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part, index]);

  if (!step) return null;

  const isLast = index === part.steps.length - 1;
  const prev = index > 0 ? part.steps[index - 1] : null;
  const canBack = !!prev && !!prev.target;

  function next() {
    if (isLast) onFinish('done');
    else setIndex(index + 1);
  }

  return (
    <CoachMarkOverlay
      size={size}
      ready={ready}
      hole={step.target ? hole : null}
      title={step.title}
      body={step.body}
      stepText={step.stepNo != null ? `${part.label}  ${step.stepNo} / ${part.total}` : undefined}
      dotIndex={(step.stepNo ?? 1) - 1}
      dotTotal={part.total}
      nextLabel={step.nextLabel ?? '次へ →'}
      onNext={next}
      onBack={canBack ? () => setIndex(index - 1) : undefined}
      onSkip={() => onFinish('skipped')}
    />
  );
}
