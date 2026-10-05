// iTunes Search API の呼び出し（通信のみを担当）。仕様書 §5.3・§6.3。
// 例外は投げず、SearchResult 型で成功・失敗を返す（呼び出し側が「0件」と
// 「通信失敗」を確実に区別できるようにするため）。

import { FETCH_LIMIT, ITUNES_COUNTRY, ITUNES_LANG } from './constants';
import { SearchMode, SearchResult, SongCandidate } from './types';

interface ItunesTrack {
  trackId: number;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
}

interface ItunesResponse {
  resultCount: number;
  results: ItunesTrack[];
}

// モードごとの検索対象。キーワードは attribute を指定せず全体から探す
const ATTRIBUTE_BY_MODE: Record<SearchMode, string | null> = {
  song: 'songTerm',
  artist: 'artistTerm',
  keyword: null,
};

export async function searchSongs(term: string, mode: SearchMode): Promise<SearchResult> {
  const trimmed = term.trim();
  // 空のときは通信せず、成功・0件として返す（§5.3「空なら検索しない」）
  if (!trimmed) return { ok: true, items: [] };

  let url =
    `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}` +
    `&country=${ITUNES_COUNTRY}&media=music&entity=song&limit=${FETCH_LIMIT}&lang=${ITUNES_LANG}`;
  const attribute = ATTRIBUTE_BY_MODE[mode];
  if (attribute) url += `&attribute=${attribute}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (!res.ok) return { ok: false, reason: 'http' };

  let data: ItunesResponse;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: 'parse' };
  }

  const items: SongCandidate[] = (data.results ?? []).map((t) => ({
    trackId: t.trackId,
    title: t.trackName ?? '',
    artist: t.artistName ?? '',
    // サムネイル(100px)をジャケット表示用に高解像度(600px)へ差し替える
    artworkUrl: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '600x600bb') : null,
    releaseDate: t.releaseDate ?? null,
  }));

  return { ok: true, items };
}
