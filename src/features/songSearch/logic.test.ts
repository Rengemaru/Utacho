/// <reference types="jest" />
// B6: 純粋関数の単体テスト。spec-1.1.0-song-flow §6.4・§8。
import { FETCH_LIMIT } from './constants';
import {
  buildInitialQuery,
  getSearchStatus,
  paginate,
  sortCandidates,
} from './logic';
import { SongCandidate } from './types';

function candidate(overrides: Partial<SongCandidate> & { trackId: number }): SongCandidate {
  return {
    title: 'title',
    artist: 'artist',
    artworkUrl: null,
    releaseDate: null,
    ...overrides,
  };
}

function makeItems(count: number): SongCandidate[] {
  return Array.from({ length: count }, (_, i) => candidate({ trackId: i }));
}

describe('getSearchStatus', () => {
  it('未検索は idle', () => {
    expect(getSearchStatus(null, false)).toBe('idle');
  });

  it('検索中は loading を優先（結果の有無を問わない）', () => {
    expect(getSearchStatus(null, true)).toBe('loading');
    expect(getSearchStatus({ ok: true, items: makeItems(10) }, true)).toBe('loading');
  });

  it('通信失敗は error', () => {
    expect(getSearchStatus({ ok: false, reason: 'network' }, false)).toBe('error');
    expect(getSearchStatus({ ok: false, reason: 'http' }, false)).toBe('error');
    expect(getSearchStatus({ ok: false, reason: 'parse' }, false)).toBe('error');
  });

  it('0件は empty', () => {
    expect(getSearchStatus({ ok: true, items: [] }, false)).toBe('empty');
  });

  it('1〜199件は complete（境界）', () => {
    expect(getSearchStatus({ ok: true, items: makeItems(1) }, false)).toBe('complete');
    expect(getSearchStatus({ ok: true, items: makeItems(FETCH_LIMIT - 1) }, false)).toBe('complete');
  });

  it('200件ちょうどは truncated（上限到達）', () => {
    expect(getSearchStatus({ ok: true, items: makeItems(FETCH_LIMIT) }, false)).toBe('truncated');
  });
});

describe('sortCandidates', () => {
  it('relevance は順序を保ち、入力を変更しない新しい配列を返す', () => {
    const items = makeItems(3);
    const result = sortCandidates(items, 'relevance');
    expect(result).not.toBe(items);
    expect(result.map((x) => x.trackId)).toEqual([0, 1, 2]);
  });

  it('発売日の降順（新しい順）。日付なしは最後', () => {
    const items = [
      candidate({ trackId: 1, releaseDate: '2020-01-01T00:00:00Z' }),
      candidate({ trackId: 2, releaseDate: null }),
      candidate({ trackId: 3, releaseDate: '2024-06-01T00:00:00Z' }),
    ];
    expect(sortCandidates(items, 'releaseDesc').map((x) => x.trackId)).toEqual([3, 1, 2]);
  });

  it('発売日の昇順（古い順）。日付なしは最後', () => {
    const items = [
      candidate({ trackId: 1, releaseDate: '2020-01-01T00:00:00Z' }),
      candidate({ trackId: 2, releaseDate: null }),
      candidate({ trackId: 3, releaseDate: '2024-06-01T00:00:00Z' }),
    ];
    expect(sortCandidates(items, 'releaseAsc').map((x) => x.trackId)).toEqual([1, 3, 2]);
  });

  it('同じ発売日は元の順番を保つ（安定ソート）', () => {
    const items = [
      candidate({ trackId: 1, releaseDate: '2020-01-01T00:00:00Z' }),
      candidate({ trackId: 2, releaseDate: '2020-01-01T00:00:00Z' }),
      candidate({ trackId: 3, releaseDate: '2020-01-01T00:00:00Z' }),
    ];
    expect(sortCandidates(items, 'releaseDesc').map((x) => x.trackId)).toEqual([1, 2, 3]);
  });

  it('曲名順（ひらがなは正しく並ぶ）', () => {
    const items = [
      candidate({ trackId: 1, title: 'い' }),
      candidate({ trackId: 2, title: 'あ' }),
      candidate({ trackId: 3, title: 'う' }),
    ];
    expect(sortCandidates(items, 'title').map((x) => x.trackId)).toEqual([2, 1, 3]);
  });

  it('入力配列を変更しない', () => {
    const items = [
      candidate({ trackId: 1, releaseDate: '2020-01-01T00:00:00Z' }),
      candidate({ trackId: 2, releaseDate: '2024-06-01T00:00:00Z' }),
    ];
    const snapshot = items.map((x) => x.trackId);
    sortCandidates(items, 'releaseDesc');
    expect(items.map((x) => x.trackId)).toEqual(snapshot);
  });
});

describe('paginate', () => {
  it('先頭 N 件を返す', () => {
    expect(paginate(makeItems(200), 50).map((x) => x.trackId)).toHaveLength(50);
  });

  it('件数より多い指定なら全件返す（端数）', () => {
    expect(paginate(makeItems(30), 50)).toHaveLength(30);
  });

  it('0 件指定は空', () => {
    expect(paginate(makeItems(10), 0)).toHaveLength(0);
  });
});

describe('buildInitialQuery', () => {
  it('曲からは曲名', () => {
    expect(buildInitialQuery('song', '残酷な天使のテーゼ', '高橋洋子')).toBe('残酷な天使のテーゼ');
  });

  it('アーティストはアーティスト名', () => {
    expect(buildInitialQuery('artist', '残酷な天使のテーゼ', '高橋洋子')).toBe('高橋洋子');
  });

  it('キーワードは曲名＋半角スペース＋アーティスト名', () => {
    expect(buildInitialQuery('keyword', '残酷な天使のテーゼ', '高橋洋子')).toBe('残酷な天使のテーゼ 高橋洋子');
  });

  it('片方が空なら前後の空白を除去する', () => {
    expect(buildInitialQuery('keyword', '残酷な天使のテーゼ', '')).toBe('残酷な天使のテーゼ');
    expect(buildInitialQuery('keyword', '', '高橋洋子')).toBe('高橋洋子');
  });
});
