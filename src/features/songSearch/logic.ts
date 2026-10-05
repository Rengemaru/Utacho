// 画面・通信に依存しない純粋関数。入力が同じなら必ず同じ結果を返す。
// 単体テスト（B6）の対象。仕様書 §5.4・§5.6・§6.4。

import { FETCH_LIMIT } from './constants';
import { SearchMode, SearchResult, SearchStatus, SongCandidate, SortKey } from './types';

/**
 * 結果の表示状態を求める。§5.4 の4状態＋検索前・読み込み中。
 * 検索中（isLoading）は結果の有無にかかわらず loading を優先する。
 */
export function getSearchStatus(result: SearchResult | null, isLoading: boolean): SearchStatus {
  if (isLoading) return 'loading';
  if (result === null) return 'idle';
  if (!result.ok) return 'error';
  if (result.items.length === 0) return 'empty';
  if (result.items.length >= FETCH_LIMIT) return 'truncated';
  return 'complete';
}

// 元の順番をタイブレークに使い、エンジンに依存せず安定ソートを保証する
function stableSort(
  items: SongCandidate[],
  compare: (a: SongCandidate, b: SongCandidate) => number,
): SongCandidate[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const c = compare(a.item, b.item);
      return c !== 0 ? c : a.index - b.index;
    })
    .map((x) => x.item);
}

/**
 * 候補を並び替える。元の配列は変更せず新しい配列を返す（安定ソート）。
 * 発売日が無いものは常に最後。曲名順は Intl.Collator('ja')（B3 で Hermes 動作確認）。
 */
export function sortCandidates(items: SongCandidate[], key: SortKey): SongCandidate[] {
  if (key === 'relevance') return [...items];

  if (key === 'title') {
    const collator = new Intl.Collator('ja');
    return stableSort(items, (a, b) => collator.compare(a.title, b.title));
  }

  // releaseDesc=新しい順 / releaseAsc=古い順。ISO 8601 文字列は辞書順＝時系列順
  const dir = key === 'releaseAsc' ? 1 : -1;
  return stableSort(items, (a, b) => {
    if (a.releaseDate === b.releaseDate) return 0;
    if (a.releaseDate === null) return 1; // 日付なしは最後
    if (b.releaseDate === null) return -1;
    return a.releaseDate < b.releaseDate ? -dir : dir;
  });
}

/** 先頭 visibleCount 件を切り出す（「もっと見る」の表示制御用） */
export function paginate(items: SongCandidate[], visibleCount: number): SongCandidate[] {
  return items.slice(0, visibleCount);
}

/**
 * 「曲を変更」で 04b を開くときの初期入力文字列を作る。§5.9。
 * 曲から＝曲名 / アーティスト＝アーティスト名 / キーワード＝曲名＋半角スペース＋アーティスト名
 */
export function buildInitialQuery(mode: SearchMode, title: string, artist: string): string {
  switch (mode) {
    case 'song':
      return title;
    case 'artist':
      return artist;
    case 'keyword':
      return `${title} ${artist}`.trim();
  }
}
