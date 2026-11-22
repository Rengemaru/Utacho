import {
  calculateMonthlyStats,
  calculateSessionSummary,
  ScoreSummaryInput,
} from './scoreSummary';

describe('scoreSummary', () => {
  const baseScores: ScoreSummaryInput[] = [
    // 曲1: 先月 DAM 90.0 -> 今日 DAM 92.5（DAMベスト更新）
    { song_id: 1, score: 90.0, scored_at: '2026-10-15T20:00', machine: 'DAM' },
    { song_id: 1, score: 92.5, scored_at: '2026-11-22T20:00', machine: 'DAM' },
    // 曲2: 先月 DAM 88.0 -> 今日 DAM 88.0（同点なのでベスト更新に含めない）
    { song_id: 2, score: 88.0, scored_at: '2026-10-20T20:00', machine: 'DAM' },
    { song_id: 2, score: 88.0, scored_at: '2026-11-22T20:10', machine: 'DAM' },
    // 曲3: 先月 DAM 95.0、JOYSOUND は初記録 85.0 -> JOYSOUND ではベスト更新（機種をまたがない）
    { song_id: 3, score: 95.0, scored_at: '2026-10-25T20:00', machine: 'DAM' },
    { song_id: 3, score: 85.0, scored_at: '2026-11-22T20:20', machine: 'JOYSOUND' },
    // 曲4: 今月別日に JOYSOUND で2回記録（初回80 -> 82）
    { song_id: 4, score: 80.0, scored_at: '2026-11-10T19:00', machine: 'JOYSOUND' },
    { song_id: 4, score: 82.0, scored_at: '2026-11-12T19:00', machine: 'JOYSOUND' },
  ];

  it('DAMとJOYSOUNDそれぞれで今日の曲数・ベスト更新数を分離集計し、同点は更新に含めない', () => {
    expect(calculateSessionSummary(baseScores, '2026-11-22', 'DAM')).toEqual({
      song_count: 2, // 曲1, 曲2
      pb_count: 1,   // 曲1のみ（曲2は同点なので除外）
    });
    expect(calculateSessionSummary(baseScores, '2026-11-22', 'JOYSOUND')).toEqual({
      song_count: 1, // 曲3
      pb_count: 1,   // DAMの95.0に影響されずJOYSOUND初記録で更新扱い
    });
  });

  it('今月の記録回数・ベスト更新数も機種別に集計される', () => {
    expect(calculateMonthlyStats(baseScores, '2026-11', 'DAM')).toEqual({
      record_count: 2,
      pb_count: 1,
    });
    expect(calculateMonthlyStats(baseScores, '2026-11', 'JOYSOUND')).toEqual({
      record_count: 3, // 曲3(1回) + 曲4(2回)
      pb_count: 2,     // 曲3, 曲4
    });
  });

  it('過去日により高い点数を後から記録した場合、今日のベスト更新判定も整合する', () => {
    const withPastHigher: ScoreSummaryInput[] = [
      ...baseScores,
      // 曲1の昨日（過去日）に 93.0 を追加 -> 今日の 92.5 は更新ではなくなる
      { song_id: 1, score: 93.0, scored_at: '2026-11-21T20:00', machine: 'DAM' },
    ];
    expect(calculateSessionSummary(withPastHigher, '2026-11-22', 'DAM')).toEqual({
      song_count: 2,
      pb_count: 0,
    });
    // 今月全体としては 93.0 > 先月90.0 なので1曲更新のまま
    expect(calculateMonthlyStats(withPastHigher, '2026-11', 'DAM')).toEqual({
      record_count: 3,
      pb_count: 1,
    });
  });
});
