import { getDb } from './client';
import { ScoreRow } from '../types';
import type { Machine } from '../lib/machine';
import {
  calculateMonthlyStats,
  calculateSessionSummary,
  MonthlyStats,
  ScoreSummaryInput,
  SessionSummary,
} from '../lib/scoreSummary';

export type { MonthlyStats, SessionSummary };

/** 未削除曲のスコアを対象機種（指定時）で取得する（今日・今月サマリー集計用） */
function getActiveScoresForSummary(machine?: Machine): ScoreSummaryInput[] {
  if (machine) {
    return getDb().getAllSync<ScoreSummaryInput>(
      `SELECT sc.song_id, sc.score, sc.scored_at, sc.machine
       FROM scores sc
       JOIN songs s ON s.id = sc.song_id
       WHERE s.deleted_at IS NULL AND sc.machine = ?`,
      [machine]
    );
  }
  return getDb().getAllSync<ScoreSummaryInput>(
    `SELECT sc.song_id, sc.score, sc.scored_at, sc.machine
     FROM scores sc
     JOIN songs s ON s.id = sc.song_id
     WHERE s.deleted_at IS NULL`
  );
}

export function getMonthlyStats(yearMonth: string, machine?: Machine): MonthlyStats {
  return calculateMonthlyStats(getActiveScoresForSummary(machine), yearMonth, machine);
}

export function getSessionSummary(date: string, machine?: Machine): SessionSummary {
  return calculateSessionSummary(getActiveScoresForSummary(machine), date, machine);
}

/** 指定日に1件以上スコアがある（＝その日に歌った）曲IDの一覧。scored_at は前方一致で判定。 */
export function getSongIdsScoredOn(date: string): number[] {
  const rows = getDb().getAllSync<{ song_id: number }>(
    'SELECT DISTINCT song_id FROM scores WHERE scored_at LIKE ?',
    [date + '%']
  );
  return rows.map((r) => r.song_id);
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
