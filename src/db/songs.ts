import { getDb } from './client';
import { SongRow, SongWithStats, TabRow } from '../types';
import type { Machine } from '../lib/machine';

// machine を渡すとその機種だけで集計する（DAM/JOYSOUND 完全分離 #71）。
// Machine は 'DAM'|'JOYSOUND' の型安全な enum なので SQL への直接埋め込みは安全。
function statsSelect(machine?: Machine): string {
  const m = machine ? ` AND machine = '${machine}'` : '';
  return `
    MAX(sc.score) AS best_score,
    (SELECT score FROM scores WHERE song_id = s.id${m} ORDER BY scored_at DESC, id DESC LIMIT 1) AS latest_score,
    (SELECT score FROM scores WHERE song_id = s.id${m} ORDER BY scored_at ASC,  id ASC  LIMIT 1) AS first_score,
    (SELECT scored_at FROM scores WHERE song_id = s.id${m} ORDER BY scored_at DESC, id DESC LIMIT 1) AS latest_scored_at,
    COUNT(sc.id) AS score_count
  `;
}

function scoresJoin(machine?: Machine): string {
  return machine
    ? `LEFT JOIN scores sc ON sc.song_id = s.id AND sc.machine = '${machine}'`
    : `LEFT JOIN scores sc ON sc.song_id = s.id`;
}

type SongStatsRow = SongRow & {
  best_score: number | null;
  latest_score: number | null;
  first_score: number | null;
  latest_scored_at: string | null;
  score_count: number;
};

function attachTabs(songs: SongStatsRow[]): SongWithStats[] {
  return songs.map((song) => ({
    ...song,
    tabs: getDb().getAllSync<TabRow>(
      'SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?',
      [song.id]
    ),
  }));
}

export function getAllSongsCount(): number {
  const result = getDb().getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM songs');
  return result?.count ?? 0;
}

/** ランダムに1曲のIDを返す。tabId が null のときは全曲から、指定時はそのタブから選ぶ。該当曲がなければ null */
export function getRandomSongId(tabId: number | null): number | null {
  if (tabId === null) {
    const row = getDb().getFirstSync<{ id: number }>(
      'SELECT id FROM songs ORDER BY RANDOM() LIMIT 1'
    );
    return row?.id ?? null;
  }
  const row = getDb().getFirstSync<{ id: number }>(
    'SELECT s.id FROM songs s JOIN song_tabs st ON st.song_id = s.id WHERE st.tab_id = ? ORDER BY RANDOM() LIMIT 1',
    [tabId]
  );
  return row?.id ?? null;
}

export function getAllSongs(machine?: Machine): SongWithStats[] {
  const songs = getDb().getAllSync<SongStatsRow>(`
    SELECT s.*, ${statsSelect(machine)}
    FROM songs s
    ${scoresJoin(machine)}
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);
  return attachTabs(songs);
}

export function getSongsByTab(tabId: number, machine?: Machine): SongWithStats[] {
  const songs = getDb().getAllSync<SongStatsRow>(`
    SELECT s.*, ${statsSelect(machine)}
    FROM songs s
    JOIN song_tabs st ON st.song_id = s.id
    ${scoresJoin(machine)}
    WHERE st.tab_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, [tabId]);
  return attachTabs(songs);
}

export function getSongsByIds(ids: number[], machine?: Machine): SongWithStats[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const songs = getDb().getAllSync<SongStatsRow>(`
    SELECT s.*, ${statsSelect(machine)}
    FROM songs s
    ${scoresJoin(machine)}
    WHERE s.id IN (${placeholders})
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, ids);
  return attachTabs(songs);
}

export function getSongById(id: number): SongWithStats | null {
  const song = getDb().getFirstSync<SongStatsRow>(`
    SELECT s.*, ${statsSelect()}
    FROM songs s
    ${scoresJoin()}
    WHERE s.id = ?
    GROUP BY s.id
  `, [id]);
  if (!song) return null;
  return {
    ...song,
    tabs: getDb().getAllSync<TabRow>(
      'SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?',
      [id]
    ),
  };
}

export function insertSong(
  title: string,
  artist: string,
  keyOffset: number | null,
  artworkUrl?: string | null,
  memo: string = '',
  titleReading: string = '',
  artistReading: string = ''
): number {
  const result = getDb().runSync(
    'INSERT INTO songs (title, artist, key_offset, artwork_url, memo, title_reading, artist_reading, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, artist, keyOffset, artworkUrl ?? null, memo, titleReading, artistReading, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export function updateSong(
  id: number,
  title: string,
  artist: string,
  keyOffset: number | null,
  artworkUrl?: string | null,
  memo: string = '',
  titleReading: string = '',
  artistReading: string = ''
): void {
  getDb().runSync(
    'UPDATE songs SET title = ?, artist = ?, key_offset = ?, artwork_url = ?, memo = ?, title_reading = ?, artist_reading = ? WHERE id = ?',
    [title, artist, keyOffset, artworkUrl ?? null, memo, titleReading, artistReading, id]
  );
}

export function deleteSong(id: number): void {
  getDb().runSync('DELETE FROM songs WHERE id = ?', [id]);
}

export function findDuplicateSong(
  title: string,
  artist: string,
  excludeId?: number,
): { id: number } | null {
  // 編集時は自分自身を比較対象から除外する（除外しないと、変更なしの保存でも警告が出る）
  if (excludeId != null) {
    return getDb().getFirstSync<{ id: number }>(
      `SELECT id FROM songs WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND LOWER(TRIM(artist)) = LOWER(TRIM(?)) AND id != ? LIMIT 1`,
      [title, artist, excludeId]
    );
  }
  return getDb().getFirstSync<{ id: number }>(
    `SELECT id FROM songs WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND LOWER(TRIM(artist)) = LOWER(TRIM(?)) LIMIT 1`,
    [title, artist]
  );
}
