// コーチマーク（チュートリアル）で照らす対象の登録と位置計測。
// 画面やタブバーなど別々の場所にある要素を、名前で登録しておき、ツアー側から位置を測る。

import { useCallback } from 'react';
import { View } from 'react-native';

export type CoachTargetName =
  | 'tab-search'      // フッターの「さがす」
  | 'search-input'    // さがす画面の検索欄
  | 'manual-entry'    // さがす画面の「手入力で登録」
  | 'song-record'     // 曲一覧の先頭カードの 🎤
  | 'song-card'       // 曲一覧の先頭カード
  | 'list-tools'      // 曲一覧の 🎲 / ⇅
  | 'machine-toggle'  // 曲詳細の DAM/JOYSOUND 切替
  | 'singing-card';   // 曲詳細のキー・テンポ・メモ

export type CoachRect = { x: number; y: number; width: number; height: number };

const targets = new Map<CoachTargetName, View>();

/** 対象の View に渡す ref コールバックを返す（collapsable={false} を併用すること） */
export function useCoachTarget(name: CoachTargetName) {
  return useCallback(
    (node: View | null) => {
      if (node) targets.set(name, node);
      else targets.delete(name);
    },
    [name],
  );
}

/** 画面（ウィンドウ）座標での位置を測る。未登録・未表示なら null */
export function measureCoachTarget(name: CoachTargetName): Promise<CoachRect | null> {
  const node = targets.get(name);
  if (!node) return Promise.resolve(null);
  return new Promise((resolve) => {
    node.measureInWindow((x, y, width, height) => {
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });
}
