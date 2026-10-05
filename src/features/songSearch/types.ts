// 曲検索モーダル（1.1.0）の型定義。
// 仕様書 docs/spec~1.1.0/spec-1.1.0-song-flow.md §6.2・§6.3 に対応。

/** 検索対象の種類。04b のモード切り替えに対応 */
export type SearchMode = 'song' | 'artist' | 'keyword';

/** 結果リストの並び順 */
export type SortKey = 'relevance' | 'releaseDesc' | 'releaseAsc' | 'title';

/**
 * 結果の表示状態（4状態＋検索前・読み込み中）。
 * idle=未検索 / loading=検索中 / empty=0件 / complete=1〜199件 /
 * truncated=200件ちょうど（上限到達） / error=通信失敗
 */
export type SearchStatus = 'idle' | 'loading' | 'empty' | 'complete' | 'truncated' | 'error';

/** iTunes から取得した曲1件 */
export type SongCandidate = {
  trackId: number;
  title: string;
  artist: string;
  artworkUrl: string | null;
  releaseDate: string | null; // ISO 8601
};

/**
 * iTunes 検索の結果。例外を投げず、成功・失敗を型で返す。
 * 呼び出し側が「0件」と「通信失敗」を確実に区別できるようにするため。
 */
export type SearchResult =
  | { ok: true; items: SongCandidate[] }
  | { ok: false; reason: 'network' | 'http' | 'parse' };
