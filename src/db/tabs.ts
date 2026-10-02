import { getDb } from './client';
import { TabRow, TabWithCount } from '../types';

export function getAllTabs(): TabRow[] {
  return getDb().getAllSync<TabRow>('SELECT * FROM tabs ORDER BY sort_order ASC');
}

export function getAllTabsWithCounts(): TabWithCount[] {
  return getDb().getAllSync<TabWithCount>(`
    SELECT t.*, COUNT(st.song_id) AS song_count
    FROM tabs t
    LEFT JOIN song_tabs st ON st.tab_id = t.id
    GROUP BY t.id
    ORDER BY t.sort_order ASC
  `);
}

/**
 * 同名タブが既にあるか調べる（trim・大文字小文字を無視、findDuplicateSong と同方針）。
 * リネーム時は自分自身を除外するため excludeId を渡す。
 */
export function findDuplicateTab(name: string, excludeId?: number): { id: number } | null {
  if (excludeId !== undefined) {
    return getDb().getFirstSync<{ id: number }>(
      'SELECT id FROM tabs WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ? LIMIT 1',
      [name, excludeId]
    );
  }
  return getDb().getFirstSync<{ id: number }>(
    'SELECT id FROM tabs WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
    [name]
  );
}

export function insertTab(name: string): number {
  const result = getDb().runSync(
    'INSERT INTO tabs (name, sort_order) VALUES (?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tabs))',
    [name]
  );
  return result.lastInsertRowId;
}

export function updateTab(id: number, name: string): void {
  getDb().runSync('UPDATE tabs SET name = ? WHERE id = ?', [name, id]);
}

export function deleteTab(id: number): void {
  getDb().runSync('DELETE FROM tabs WHERE id = ?', [id]);
}

export function updateTabOrder(tabs: { id: number; sort_order: number }[]): void {
  for (const tab of tabs) {
    getDb().runSync('UPDATE tabs SET sort_order = ? WHERE id = ?', [tab.sort_order, tab.id]);
  }
}
