import { getDb } from './client';
import { ScoreRow } from '../types';

export interface MonthlyStats {
  record_count: number;
  pb_count: number;
}

export function getMonthlyStats(yearMonth: string): MonthlyStats {
  const countRow = getDb().getFirstSync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM scores WHERE scored_at LIKE ?",
    [yearMonth + '%']
  );
  const pbRow = getDb().getFirstSync<{ pb_count: number }>(`
    SELECT COUNT(*) AS pb_count
    FROM (
      SELECT song_id, MAX(score) AS month_best
      FROM scores WHERE scored_at LIKE ?
      GROUP BY song_id
    ) month_scores
    JOIN (
      SELECT song_id, MAX(score) AS all_time_best
      FROM scores GROUP BY song_id
    ) all_time ON month_scores.song_id = all_time.song_id
    WHERE month_scores.month_best >= all_time.all_time_best
  `, [yearMonth + '%']);
  return {
    record_count: countRow?.count ?? 0,
    pb_count: pbRow?.pb_count ?? 0,
  };
}

export interface SessionSummary {
  song_count: number;
  pb_count: number;
}

export function getSessionSummary(date: string): SessionSummary {
  // scored_at は「YYYY-MM-DDTHH:MM」形式。日付のみの旧データ「YYYY-MM-DD」も前方一致で拾える
  const datePrefix = date + '%';
  const countRow = getDb().getFirstSync<{ song_count: number }>(
    'SELECT COUNT(DISTINCT song_id) AS song_count FROM scores WHERE scored_at LIKE ?',
    [datePrefix]
  );
  const pbRow = getDb().getFirstSync<{ pb_count: number }>(`
    SELECT COUNT(*) AS pb_count
    FROM (
      SELECT song_id, MAX(score) AS today_best
      FROM scores WHERE scored_at LIKE ?
      GROUP BY song_id
    ) today
    JOIN (
      SELECT song_id, MAX(score) AS all_time_best
      FROM scores GROUP BY song_id
    ) all_time ON today.song_id = all_time.song_id
    WHERE today.today_best >= all_time.all_time_best
  `, [datePrefix]);
  return {
    song_count: countRow?.song_count ?? 0,
    pb_count: pbRow?.pb_count ?? 0,
  };
}

export function getScoresBySong(songId: number): ScoreRow[] {
  // 同じ分に複数記録があっても登録順で安定させるため id を第2キーにする
  return getDb().getAllSync<ScoreRow>(
    'SELECT * FROM scores WHERE song_id = ? ORDER BY scored_at DESC, id DESC',
    [songId]
  );
}

/** 指定機種での最高スコアを返す（自己ベスト判定用・#71）。記録が無ければ null */
export function getBestScore(songId: number, machine: string): number | null {
  const row = getDb().getFirstSync<{ best: number | null }>(
    'SELECT MAX(score) AS best FROM scores WHERE song_id = ? AND machine = ?',
    [songId, machine]
  );
  return row?.best ?? null;
}

export function insertScore(songId: number, score: number, scoredAt: string, machine: string): number {
  const result = getDb().runSync(
    'INSERT INTO scores (song_id, score, scored_at, machine) VALUES (?, ?, ?, ?)',
    [songId, score, scoredAt, machine]
  );
  return result.lastInsertRowId;
}

// scoredAt を渡すと記録日も更新する。省略時は従来どおり点数・機種のみ更新する
export function updateScore(id: number, score: number, machine: string, scoredAt?: string): void {
  if (scoredAt !== undefined) {
    getDb().runSync(
      'UPDATE scores SET score = ?, machine = ?, scored_at = ? WHERE id = ?',
      [score, machine, scoredAt, id]
    );
    return;
  }
  getDb().runSync(
    'UPDATE scores SET score = ?, machine = ? WHERE id = ?',
    [score, machine, id]
  );
}

export function deleteScore(id: number): void {
  getDb().runSync('DELETE FROM scores WHERE id = ?', [id]);
}
