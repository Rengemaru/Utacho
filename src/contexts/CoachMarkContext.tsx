// コーチマーク（チュートリアル）の表示場所。アプリ全体（タブバー含む）を包み、その最前面にツアーを重ねる。
// 各画面は useCoachMark().startTour(part) を呼ぶだけでよい。
// 対象とオーバーレイを同じウィンドウ・同じ基準で測るので、照らす位置が実際の部品にぴったり合う。

import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { CoachMarkTour, CoachOrigin, CoachTourResult } from '../components/CoachMarkTour';
import type { CoachPart, CoachStep } from '../data/tutorialSteps';

type TourOptions = {
  onFinish?: (result: CoachTourResult) => void;
  onBeforeStep?: (step: CoachStep) => Promise<void>;
};

type ActiveTour = TourOptions & { part: CoachPart };

type CoachMarkContextValue = {
  /** 表示中のパート（無ければ null） */
  activePart: CoachPart | null;
  startTour: (part: CoachPart, options?: TourOptions) => void;
};

const CoachMarkContext = createContext<CoachMarkContextValue | null>(null);

export function CoachMarkProvider({ children }: { children: ReactNode }) {
  const rootRef = useRef<View>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState<ActiveTour | null>(null);

  const startTour = useCallback((part: CoachPart, options?: TourOptions) => {
    setActive({ part, ...options });
  }, []);

  const getOrigin = useCallback(
    () =>
      new Promise<CoachOrigin>((resolve) => {
        const node = rootRef.current;
        if (!node) {
          resolve({ x: 0, y: 0 });
          return;
        }
        node.measureInWindow((x, y) => resolve({ x, y }));
      }),
    [],
  );

  const handleFinish = useCallback(
    (result: CoachTourResult) => {
      const finished = active;
      setActive(null);
      finished?.onFinish?.(result);
    },
    [active],
  );

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }

  const value = useMemo(() => ({ activePart: active?.part ?? null, startTour }), [active, startTour]);

  return (
    <CoachMarkContext.Provider value={value}>
      <View ref={rootRef} style={styles.root} collapsable={false} onLayout={handleLayout}>
        {children}
        {active && size.w > 0 && (
          <CoachMarkTour
            part={active.part}
            onFinish={handleFinish}
            onBeforeStep={active.onBeforeStep}
            getOrigin={getOrigin}
            size={size}
          />
        )}
      </View>
    </CoachMarkContext.Provider>
  );
}

export function useCoachMark(): CoachMarkContextValue {
  const ctx = useContext(CoachMarkContext);
  if (!ctx) throw new Error('useCoachMark must be used inside CoachMarkProvider');
  return ctx;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
