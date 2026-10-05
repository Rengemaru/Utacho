import { SongWithStats, TabRow, TabWithCount, ScoreRow } from '../types';

export const MOCK_TABS: TabRow[] = [
  { id: 1, name: '十八番', sort_order: 1 },
  { id: 2, name: '練習中', sort_order: 2 },
  { id: 3, name: 'アニソン', sort_order: 3 },
];

export const MOCK_TABS_WITH_COUNTS: TabWithCount[] = [
  { id: 1, name: '十八番', sort_order: 1, song_count: 3 },
  { id: 2, name: '練習中', sort_order: 2, song_count: 1 },
  { id: 3, name: 'アニソン', sort_order: 3, song_count: 2 },
];

export const MOCK_SONGS: SongWithStats[] = [
  {
    id: 1, title: 'ガーネット', artist: '奥華子', key_offset: 1,
    artwork_url: null, memo: '', title_reading: '', artist_reading: '', created_at: '2026-05-01T00:00:00',
    best_score: 92.4, latest_score: 92.4, first_score: 83.5,
    latest_scored_at: '2026-05-10T22:15', score_count: 4,
    tabs: [MOCK_TABS[0]],
  },
  {
    id: 2, title: 'Lemon', artist: '米津玄師', key_offset: -3,
    artwork_url: null, memo: '', title_reading: '', artist_reading: '', created_at: '2026-05-02T00:00:00',
    best_score: 89.1, latest_score: 89.1, first_score: 84.3,
    latest_scored_at: '2026-05-01T20:00', score_count: 2,
    tabs: [MOCK_TABS[0]],
  },
  {
    id: 3, title: '夜に駆ける', artist: 'YOASOBI', key_offset: 2,
    artwork_url: null, memo: '', title_reading: '', artist_reading: '', created_at: '2026-05-03T00:00:00',
    best_score: 85.7, latest_score: 85.7, first_score: 80.2,
    latest_scored_at: '2026-05-20T21:00', score_count: 2,
    tabs: [MOCK_TABS[0], MOCK_TABS[2]],
  },
  {
    id: 4, title: 'カタオモイ', artist: 'Aimer', key_offset: null,
    artwork_url: null, memo: '', title_reading: '', artist_reading: '', created_at: '2026-05-04T00:00:00',
    best_score: 88.3, latest_score: 88.3, first_score: 88.3,
    latest_scored_at: '2026-05-15T21:30', score_count: 1,
    tabs: [],
  },
  {
    id: 5, title: '炎', artist: 'LiSA', key_offset: -1,
    artwork_url: null, memo: '', title_reading: '', artist_reading: '', created_at: '2026-05-05T00:00:00',
    best_score: 83.2, latest_score: 83.2, first_score: 78.9,
    latest_scored_at: '2026-05-22T22:00', score_count: 2,
    tabs: [MOCK_TABS[1], MOCK_TABS[2]],
  },
];

export const MOCK_SCORES: Record<number, ScoreRow[]> = {
  // 同じ日（2026-05-10）の夜に3回歌って上達していく様子を分単位で再現
  1: [
    { id: 4, song_id: 1, score: 92.4, scored_at: '2026-05-10T22:15', machine: 'DAM' },
    { id: 3, song_id: 1, score: 90.1, scored_at: '2026-05-10T21:40', machine: 'DAM' },
    { id: 2, song_id: 1, score: 86.0, scored_at: '2026-05-10T21:05', machine: 'DAM' },
    { id: 1, song_id: 1, score: 83.5, scored_at: '2026-03-18T20:30', machine: 'JOYSOUND' },
  ],
  2: [
    { id: 6, song_id: 2, score: 89.1, scored_at: '2026-05-01T20:00', machine: 'DAM' },
    { id: 5, song_id: 2, score: 84.3, scored_at: '2026-04-10T19:30', machine: 'DAM' },
  ],
  3: [
    { id: 8, song_id: 3, score: 85.7, scored_at: '2026-05-20T21:00', machine: 'JOYSOUND' },
    { id: 7, song_id: 3, score: 80.2, scored_at: '2026-03-01T20:00', machine: 'DAM' },
  ],
  4: [
    { id: 9, song_id: 4, score: 88.3, scored_at: '2026-05-15T21:30', machine: 'DAM' },
  ],
  5: [
    { id: 11, song_id: 5, score: 83.2, scored_at: '2026-05-22T22:00', machine: 'JOYSOUND' },
    { id: 10, song_id: 5, score: 78.9, scored_at: '2026-04-15T20:30', machine: 'DAM' },
  ],
};
