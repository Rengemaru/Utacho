import { SongWithStats } from '../types';
import { normalizeForSearch } from './text';

export type TabSongSortKey =
  | 'selected_first'
  | 'unselected_first'
  | 'created_at'
  | 'title'
  | 'artist';

export const TAB_SONG_SORT_OPTIONS: readonly { key: TabSongSortKey; label: string }[] = [
  { key: 'selected_first', label: '選択中を上' },
  { key: 'unselected_first', label: '未選択を上' },
  { key: 'created_at', label: '登録日' },
  { key: 'title', label: '曲名' },
  { key: 'artist', label: 'アーティスト' },
];

const jaCollator = new Intl.Collator('ja');

/** 曲一覧を検索語で絞り込み、指定の並び順でソートして返す */
export function filterAndSortTabPickerSongs(
  songs: readonly SongWithStats[],
  query: string,
  sortKey: TabSongSortKey,
  selectedIdsForSort: ReadonlySet<number>,
): SongWithStats[] {
  const q = normalizeForSearch(query);
  const base = q
    ? songs.filter((s) => {
        const fields = [s.title, s.artist, s.title_reading, s.artist_reading].map(normalizeForSearch);
        return fields.some((f) => f.includes(q));
      })
    : songs;

  const sorted = [...base];
  if (sortKey === 'selected_first' || sortKey === 'unselected_first') {
    const selectedRank = sortKey === 'selected_first' ? 0 : 1;
    const unselectedRank = sortKey === 'selected_first' ? 1 : 0;
    sorted.sort((a, b) => {
      const rankA = selectedIdsForSort.has(a.id) ? selectedRank : unselectedRank;
      const rankB = selectedIdsForSort.has(b.id) ? selectedRank : unselectedRank;
      if (rankA !== rankB) return rankA - rankB;
      return b.created_at.localeCompare(a.created_at);
    });
  } else if (sortKey === 'title') {
    sorted.sort((a, b) => jaCollator.compare(
      normalizeForSearch(a.title_reading || a.title),
      normalizeForSearch(b.title_reading || b.title),
    ));
  } else if (sortKey === 'artist') {
    sorted.sort((a, b) => jaCollator.compare(
      normalizeForSearch(a.artist_reading || a.artist),
      normalizeForSearch(b.artist_reading || b.artist),
    ));
  } else {
    sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return sorted;
}

/** 検索結果の外にある選択済み曲数を返す */
export function countHiddenSelectedSongs(
  visibleSongs: readonly SongWithStats[],
  checkedIds: ReadonlySet<number>,
): number {
  let visibleSelected = 0;
  for (const song of visibleSongs) {
    if (checkedIds.has(song.id)) visibleSelected += 1;
  }
  return Math.max(0, checkedIds.size - visibleSelected);
}
