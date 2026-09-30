import { getDb } from './client';

/** 各テーブルの件数 */
export interface DataCounts {
  songs: number;
  scores: number;
  tabs: number;
  song_tabs: number;
}

/** 主要テーブルの件数をまとめて取得する（復元前後の差分表示・確認用） */
export function getDataCounts(): DataCounts {
  const db = getDb();
  const count = (table: string): number =>
    db.getFirstSync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`)?.count ?? 0;
  return {
    songs: count('songs'),
    scores: count('scores'),
    tabs: count('tabs'),
    song_tabs: count('song_tabs'),
  };
}

/**
 * 全データを削除する。FK制約のため scores → song_tabs → songs → tabs の順。
 * トランザクションで囲み、途中失敗時は全体をロールバックして部分削除を防ぐ。
 */
export function deleteAllData(): void {
  const db = getDb();
  db.execSync('BEGIN TRANSACTION');
  try {
    db.execSync('DELETE FROM scores');
    db.execSync('DELETE FROM song_tabs');
    db.execSync('DELETE FROM songs');
    db.execSync('DELETE FROM tabs');
    db.execSync('COMMIT');
  } catch (e) {
    db.execSync('ROLLBACK');
    throw e;
  }
}
