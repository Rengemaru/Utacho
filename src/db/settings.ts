import { getDb } from './client';
import {
  addHistoryEntry,
  parseHistory,
  removeHistoryEntry,
  SearchHistoryKey,
} from '../lib/searchHistory';

export async function getSetting(key: string): Promise<string | null> {
  const row = await getDb().getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

export async function deleteSetting(key: string): Promise<void> {
  await getDb().runAsync('DELETE FROM settings WHERE key = ?', [key]);
}

export function getSettingSync(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export function setSettingSync(key: string, value: string): void {
  getDb().runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

// ---- セットリスト（今日歌う曲リスト）----

export function getSetlistSongIds(date: string): number[] {
  const storedDate = getSettingSync('setlist_date');
  if (storedDate !== date) return [];
  const idsJson = getSettingSync('setlist_song_ids');
  if (!idsJson) return [];
  try {
    return JSON.parse(idsJson) as number[];
  } catch {
    return [];
  }
}

export function saveSetlistSongIds(date: string, ids: number[]): void {
  setSettingSync('setlist_date', date);
  setSettingSync('setlist_song_ids', JSON.stringify(ids));
}

// ---- 検索キーワード履歴（#91）----

/** 履歴を取得（最新が先頭）。壊れた値は空配列。 */
export function getSearchHistory(key: SearchHistoryKey): string[] {
  return parseHistory(getSettingSync(key));
}

/** キーワードを履歴へ追加し、更新後の配列を返す。 */
export function pushSearchHistory(key: SearchHistoryKey, term: string): string[] {
  const next = addHistoryEntry(getSearchHistory(key), term);
  setSettingSync(key, JSON.stringify(next));
  return next;
}

/** 履歴から1件削除し、更新後の配列を返す。 */
export function deleteSearchHistoryEntry(key: SearchHistoryKey, term: string): string[] {
  const next = removeHistoryEntry(getSearchHistory(key), term);
  setSettingSync(key, JSON.stringify(next));
  return next;
}

/** 履歴を全消去する。 */
export function clearSearchHistory(key: SearchHistoryKey): void {
  setSettingSync(key, '[]');
}
