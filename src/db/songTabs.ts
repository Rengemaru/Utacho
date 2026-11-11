import { getDb } from './client';
import { TabRow } from '../types';

export function getTabsBySong(songId: number): TabRow[] {
  return getDb().getAllSync<TabRow>(
    'SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?',
    [songId]
  );
}

export function attachTab(songId: number, tabId: number): void {
  getDb().runSync(
    'INSERT OR IGNORE INTO song_tabs (song_id, tab_id) VALUES (?, ?)',
    [songId, tabId]
  );
}

export function detachTab(songId: number, tabId: number): void {
  getDb().runSync(
    'DELETE FROM song_tabs WHERE song_id = ? AND tab_id = ?',
    [songId, tabId]
  );
}

export function syncTabs(songId: number, tabIds: number[]): void {
  getDb().runSync('DELETE FROM song_tabs WHERE song_id = ?', [songId]);
  for (const tabId of tabIds) {
    attachTab(songId, tabId);
  }
}

/**
 * 指定タブの所属曲を一括設定する（タブ起点の割り当て・#117）。
 * syncTabs の tab 版。既存の紐づけを一度すべて外してから、渡された曲IDを貼り直す。
 */
export function setSongsForTab(tabId: number, songIds: number[]): void {
  getDb().runSync('DELETE FROM song_tabs WHERE tab_id = ?', [tabId]);
  for (const songId of songIds) {
    getDb().runSync(
      'INSERT OR IGNORE INTO song_tabs (song_id, tab_id) VALUES (?, ?)',
      [songId, tabId]
    );
  }
}
