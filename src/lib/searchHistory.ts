// 検索キーワード履歴の純粋関数（#91）。DB・画面に依存しない。
// 永続化は src/db/settings.ts 側（setlist と同じ流儀で settings テーブルに JSON 保存）。

export const SEARCH_HISTORY_MAX = 10;

// どの検索の履歴かを区別する settings キー
export type SearchHistoryKey = 'search_history_itunes' | 'search_history_home';

/**
 * 新しいキーワードを先頭に追加した配列を返す（元配列は変更しない）。
 * 前後空白を除去し、空なら無変更。既存の同一キーワードは除いて先頭へ移動（最新を先頭）。
 * 最大件数で末尾を切り捨てる。
 */
export function addHistoryEntry(history: string[], term: string, max = SEARCH_HISTORY_MAX): string[] {
  const t = term.trim();
  if (!t) return history;
  const rest = history.filter((h) => h !== t);
  return [t, ...rest].slice(0, max);
}

/** 指定キーワードを取り除いた配列を返す（元配列は変更しない）。 */
export function removeHistoryEntry(history: string[], term: string): string[] {
  return history.filter((h) => h !== term);
}

/** 保存文字列（JSON）を文字列配列へ。未設定・壊れた値は空配列として扱う。 */
export function parseHistory(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}
