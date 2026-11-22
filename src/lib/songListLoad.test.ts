import type { SongWithStats } from '../types';
import { runSongListLoad, SONG_LIST_LOAD_ERROR_MESSAGE } from './songListLoad';

function makeSong(id: number, title: string): SongWithStats {
  return {
    id,
    title,
    artist: 'Artist',
    key_offset: null,
    tempo_offset: null,
    artwork_url: null,
    memo: '',
    title_reading: '',
    artist_reading: '',
    created_at: '2026-11-22T00:00:00.000Z',
    deleted_at: null,
    best_score: null,
    latest_score: null,
    first_score: null,
    latest_scored_at: null,
    score_count: 0,
    tabs: [],
  };
}

describe('runSongListLoad (U25)', () => {
  it('成功時は曲一覧と error: null を返す', () => {
    const songs = [makeSong(1, '紅蓮華')];
    const result = runSongListLoad(() => songs);

    expect(result).toEqual({ ok: true, songs, error: null });
  });

  it('失敗時はエラー文言を返し、onError に例外を通知する', () => {
    const boom = new Error('SQLite busy');
    const onError = jest.fn();

    const result = runSongListLoad(() => {
      throw boom;
    }, onError);

    expect(result).toEqual({ ok: false, error: SONG_LIST_LOAD_ERROR_MESSAGE });
    expect(onError).toHaveBeenCalledWith(boom);
  });

  it('失敗 → 再失敗 → 再読み込み成功の遷移で通常一覧に復帰できる', () => {
    let attempt = 0;
    const songs = [makeSong(1, '残酷な夜に輝け')];
    const loader = () => {
      attempt += 1;
      if (attempt <= 2) {
        throw new Error(`fail #${attempt}`);
      }
      return songs;
    };

    const first = runSongListLoad(loader);
    expect(first).toEqual({ ok: false, error: SONG_LIST_LOAD_ERROR_MESSAGE });

    const second = runSongListLoad(loader);
    expect(second).toEqual({ ok: false, error: SONG_LIST_LOAD_ERROR_MESSAGE });

    const third = runSongListLoad(loader);
    expect(third).toEqual({ ok: true, songs, error: null });
  });
});
