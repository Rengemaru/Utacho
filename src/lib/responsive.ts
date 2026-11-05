// 画面幅に応じたレスポンシブ判定（#92）。タブレット（大画面）向けのレイアウト最適化に使う。

import { useWindowDimensions } from 'react-native';

// タブレット判定のしきい値（dp）。一般的な7インチタブレットの短辺が約600dp。
export const TABLET_MIN_WIDTH = 600;

// 曲リストを2カラム表示に切り替えるしきい値（dp）。
export const TWO_COLUMN_MIN_WIDTH = 700;

/** 現在の画面幅がタブレット相当かどうか。回転にも追従する。 */
export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= TABLET_MIN_WIDTH;
}

/** 曲一覧を2カラムにすべき幅かどうか。 */
export function useTwoColumn(): boolean {
  const { width } = useWindowDimensions();
  return width >= TWO_COLUMN_MIN_WIDTH;
}
