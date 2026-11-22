import type { SongWithStats } from '../types';

export const SONG_LIST_LOAD_ERROR_MESSAGE = 'データの取得に失敗しました';

export type SongListLoadResult =
  | { ok: true; songs: SongWithStats[]; error: null }
  | { ok: false; error: string };

/**
 * 曲一覧取得を実行し、成功/失敗の結果を返す（U25）。
 * 再読み込み時に成功すれば error: null に復帰し、再失敗してもエラー状態を維持できる。
 */
export function runSongListLoad(
  loader: () => SongWithStats[],
  onError?: (e: unknown) => void,
): SongListLoadResult {
  try {
    const songs = loader();
    return { ok: true, songs, error: null };
  } catch (e) {
    onError?.(e);
    return { ok: false, error: SONG_LIST_LOAD_ERROR_MESSAGE };
  }
}
