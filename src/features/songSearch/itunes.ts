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

// 応答が返らないときに loading が固着しないためのタイムアウト（#80）
const REQUEST_TIMEOUT_MS = 10000;

export async function searchSongs(term: string, mode: SearchMode): Promise<SearchResult> {
  const trimmed = term.trim();
  // 空のときは通信せず、成功・0件として返す（§5.3「空なら検索しない」）
  if (!trimmed) return { ok: true, items: [] };

  let url =
    `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}` +
    `&country=${ITUNES_COUNTRY}&media=music&entity=song&limit=${FETCH_LIMIT}&lang=${ITUNES_LANG}`;
  const attribute = ATTRIBUTE_BY_MODE[mode];
  if (attribute) url += `&attribute=${attribute}`;

  // タイムアウト到達で abort → fetch/json が reject され network/parse 失敗として扱う（#80）
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
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

    // trackId の重複を除外する（iTunes が同一 trackId を複数返す場合のキー衝突対策・#82）
    const seen = new Set<number>();
    const items: SongCandidate[] = [];
    for (const t of data.results ?? []) {
      if (seen.has(t.trackId)) continue;
      seen.add(t.trackId);
      items.push({
        trackId: t.trackId,
        title: t.trackName ?? '',
        artist: t.artistName ?? '',
        // サムネイル(100px)をジャケット表示用に高解像度(600px)へ差し替える
        artworkUrl: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '600x600bb') : null,
        releaseDate: t.releaseDate ?? null,
      });
    }

    return { ok: true, items };
  } finally {
    clearTimeout(timer);
  }
}
