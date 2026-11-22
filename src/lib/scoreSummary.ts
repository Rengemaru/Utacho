import type { Machine } from './machine';

export interface ScoreSummaryInput {
  song_id: number;
  score: number;
  scored_at: string;
  machine: string;
}

export interface SessionSummary {
  song_count: number;
  pb_count: number;
}

export interface MonthlyStats {
  record_count: number;
  pb_count: number;
}

/**
 * 対象期間（prefix 前方一致：'YYYY-MM-DD' または 'YYYY-MM'）より前に記録された
 * 同一機種の最高点より真に大きい点数を期間内に出した曲数を数える（同点は更新に含めない）。
 */
function countPeriodPersonalBests(
  scores: readonly ScoreSummaryInput[],
  periodPrefix: string,
): number {
  const periodBestBySong = new Map<number, number>();
  const priorBestBySong = new Map<number, number>();

  for (const s of scores) {
    if (s.scored_at.startsWith(periodPrefix)) {
      const cur = periodBestBySong.get(s.song_id);
      if (cur === undefined || s.score > cur) {
        periodBestBySong.set(s.song_id, s.score);
      }
    } else if (s.scored_at < periodPrefix) {
      const cur = priorBestBySong.get(s.song_id);
      if (cur === undefined || s.score > cur) {
        priorBestBySong.set(s.song_id, s.score);
      }
    }
  }

  let pbCount = 0;
  for (const [songId, periodBest] of periodBestBySong) {
    const priorBest = priorBestBySong.get(songId);
    // 期間より前の記録が無い（初回記録）か、期間前の最高点を真に上回った場合のみベスト更新
    if (priorBest === undefined || periodBest > priorBest) {
      pbCount += 1;
    }
  }
  return pbCount;
}

/** 指定日・指定機種のセッションサマリー（記録曲数・ベスト更新曲数）を算出する */
export function calculateSessionSummary(
  scores: readonly ScoreSummaryInput[],
  date: string,
  machine?: Machine,
): SessionSummary {
  const scoped = machine ? scores.filter((s) => s.machine === machine) : scores;
  const todaySongIds = new Set<number>();
  for (const s of scoped) {
    if (s.scored_at.startsWith(date)) {
      todaySongIds.add(s.song_id);
    }
  }
  return {
    song_count: todaySongIds.size,
    pb_count: countPeriodPersonalBests(scoped, date),
  };
}

/** 指定月・指定機種の月次サマリー（記録回数・ベスト更新曲数）を算出する */
export function calculateMonthlyStats(
  scores: readonly ScoreSummaryInput[],
  yearMonth: string,
  machine?: Machine,
): MonthlyStats {
  const scoped = machine ? scores.filter((s) => s.machine === machine) : scores;
  let recordCount = 0;
  for (const s of scoped) {
    if (s.scored_at.startsWith(yearMonth)) {
      recordCount += 1;
    }
  }
  return {
    record_count: recordCount,
    pb_count: countPeriodPersonalBests(scoped, yearMonth),
  };
}
