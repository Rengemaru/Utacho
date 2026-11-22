import { SongWithStats } from '../types';
import {
  countHiddenSelectedSongs,
  filterAndSortTabPickerSongs,
} from './tabSongPicker';

function makeSong(overrides: Partial<SongWithStats> & { id: number; title: string }): SongWithStats {
  return {
    artist: '',
    key_offset: null,
    tempo_offset: null,
    artwork_url: null,
    memo: '',
    title_reading: '',
    artist_reading: '',
    created_at: '2026-05-01T00:00:00.000Z',
    deleted_at: null,
    best_score: null,
    latest_score: null,
    first_score: null,
    latest_scored_at: null,
    score_count: 0,
    tabs: [],
    ...overrides,
  };
}

const SONGS: SongWithStats[] = [
  makeSong({ id: 1, title: 'ガーネット', artist: '奥華子', created_at: '2026-05-01T00:00:00.000Z' }),
  makeSong({ id: 2, title: '炎', artist: 'LiSA', created_at: '2026-05-03T00:00:00.000Z' }),
  makeSong({ id: 3, title: 'Lemon', artist: '米津玄師', created_at: '2026-05-02T00:00:00.000Z' }),
  makeSong({ id: 4, title: '紅蓮華', artist: 'LiSA', created_at: '2026-05-04T00:00:00.000Z' }),
];

describe('tabSongPicker', () => {
  it('選択中を上 で選択済み曲が上、未選択曲が下に登録日降順で並ぶ', () => {
    const selected = new Set([1, 3]);
    const result = filterAndSortTabPickerSongs(SONGS, '', 'selected_first', selected);
    expect(result.map((s) => s.id)).toEqual([3, 1, 4, 2]);
  });

  it('未選択を上 で未選択曲が上、選択済み曲が下に登録日降順で並ぶ', () => {
    const selected = new Set([1, 3]);
    const result = filterAndSortTabPickerSongs(SONGS, '', 'unselected_first', selected);
    expect(result.map((s) => s.id)).toEqual([4, 2, 3, 1]);
  });

  it('検索条件に合う曲は選択状態にかかわらず両方表示され、並び順も維持される', () => {
    const selected = new Set([2]);
    const selectedFirst = filterAndSortTabPickerSongs(SONGS, 'LiSA', 'selected_first', selected);
    expect(selectedFirst.map((s) => s.id)).toEqual([2, 4]);

    const unselectedFirst = filterAndSortTabPickerSongs(SONGS, 'LiSA', 'unselected_first', selected);
    expect(unselectedFirst.map((s) => s.id)).toEqual([4, 2]);
  });

  it('検索で隠れた選択済み曲の件数を集計できる', () => {
    const checked = new Set([1, 2, 3]);
    const visible = filterAndSortTabPickerSongs(SONGS, 'LiSA', 'selected_first', checked);
    // LiSA に一致するのは id=2(選択済), id=4(未選択) なので、検索外の選択曲は id=1, 3 の2曲
    expect(countHiddenSelectedSongs(visible, checked)).toBe(2);
  });
});
