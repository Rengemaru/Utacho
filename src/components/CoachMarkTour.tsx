// コーチマークのツアー（ステップ送り）。各ステップの対象の位置を測り、CoachMarkOverlay で表示する。
// 対象が見つからない（非表示など）ステップは飛ばす。

import { useEffect, useState } from 'react';
import type { CoachPart, CoachStep } from '../data/tutorialSteps';
import { measureCoachTarget } from '../lib/coachTargets';
import { CoachHole, CoachMarkOverlay } from './CoachMarkOverlay';

const DEFAULT_PADDING = 6;
const DEFAULT_RADIUS = 14;
const MEASURE_RETRIES = 5;
const MEASURE_INTERVAL_MS = 120;

export type CoachTourResult = 'done' | 'skipped';

interface Props {
  part: CoachPart | null;
  onFinish: (result: CoachTourResult) => void;
  /** ステップ表示前の準備（対象が見えるようにスクロールする等） */
  onBeforeStep?: (step: CoachStep) => Promise<void>;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function measureWithRetry(step: CoachStep): Promise<CoachHole | null> {
  if (!step.target) return null;
  for (let i = 0; i < MEASURE_RETRIES; i++) {
    const rect = await measureCoachTarget(step.target);
    if (rect) {
      const pad = step.padding ?? DEFAULT_PADDING;
      return {
        x: rect.x - pad,
        y: rect.y - pad,
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

export function CoachMarkTour({ part, onFinish, onBeforeStep }: Props) {
  if (!part) return null;
  // パートが変わったら作り直して先頭のステップから始める
  return <Tour key={`${part.label}:${part.steps[0]?.title ?? ''}`} part={part} onFinish={onFinish} onBeforeStep={onBeforeStep} />;
}

function Tour({ part, onFinish, onBeforeStep }: Props & { part: CoachPart }) {
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState<CoachHole | null>(null);
  const [ready, setReady] = useState(false);

  const step = part.steps[index] ?? null;

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
      const measured = await measureWithRetry(step);
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
      visible
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
