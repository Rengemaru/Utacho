import { getDb } from './client';
import { SongRow, SongWithStats, TabRow } from '../types';
import type { Machine } from '../lib/machine';

// machine を渡すとその機種だけで集計する（DAM/JOYSOUND 完全分離 #71）。
// SQL へ直接埋め込むため、実行時にも 'DAM'|'JOYSOUND' 以外を弾く（#76: as Machine 等の混入対策）。
function machineClause(machine?: Machine): string {
  if (!machine) return '';
  if (machine !== 'DAM' && machine !== 'JOYSOUND') {
    throw new Error(`invalid machine value: ${String(machine)}`);
  }
  return ` AND machine = '${machine}'`;
}

function statsSelect(machine?: Machine): string {
  const m = machineClause(machine);
  return `
    MAX(sc.score) AS best_score,
    (SELECT score FROM scores WHERE song_id = s.id${m} ORDER BY scored_at DESC, id DESC LIMIT 1) AS latest_score,
    (SELECT score FROM scores WHERE song_id = s.id${m} ORDER BY scored_at ASC,  id ASC  LIMIT 1) AS first_score,
    (SELECT scored_at FROM scores WHERE song_id = s.id${m} ORDER BY scored_at DESC, id DESC LIMIT 1) AS latest_scored_at,
    COUNT(sc.id) AS score_count
  `;
}

function scoresJoin(machine?: Machine): string {
  const m = machineClause(machine); // 不正値はここで例外（sc.machine も同じ検証値を使う）
  return m
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
  // 論理削除済み（ゴミ箱）は除く
  const result = getDb().getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM songs WHERE deleted_at IS NULL');
  return result?.count ?? 0;
}

/** ランダムに1曲のIDを返す。tabId が null のときは全曲から、指定時はそのタブから選ぶ。該当曲がなければ null */
export function getRandomSongId(tabId: number | null): number | null {
  if (tabId === null) {
    const row = getDb().getFirstSync<{ id: number }>(
      'SELECT id FROM songs WHERE deleted_at IS NULL ORDER BY RANDOM() LIMIT 1'
    );
    return row?.id ?? null;
  }
  const row = getDb().getFirstSync<{ id: number }>(
    'SELECT s.id FROM songs s JOIN song_tabs st ON st.song_id = s.id WHERE st.tab_id = ? AND s.deleted_at IS NULL ORDER BY RANDOM() LIMIT 1',
    [tabId]
  );
  return row?.id ?? null;
}

export function getAllSongs(machine?: Machine): SongWithStats[] {
  const songs = getDb().getAllSync<SongStatsRow>(`
    SELECT s.*, ${statsSelect(machine)}
    FROM songs s
    ${scoresJoin(machine)}
    WHERE s.deleted_at IS NULL
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
    WHERE st.tab_id = ? AND s.deleted_at IS NULL
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
    WHERE s.id IN (${placeholders}) AND s.deleted_at IS NULL
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, ids);
  return attachTabs(songs);
}

/** ゴミ箱（論理削除済み）の曲を、削除日時の新しい順で返す */
export function getDeletedSongs(): SongWithStats[] {
  const songs = getDb().getAllSync<SongStatsRow>(`
    SELECT s.*, ${statsSelect()}
    FROM songs s
    ${scoresJoin()}
    WHERE s.deleted_at IS NOT NULL
    GROUP BY s.id
    ORDER BY s.deleted_at DESC
  `);
  return attachTabs(songs);
}

/** ゴミ箱の件数 */
export function getDeletedCount(): number {
  const r = getDb().getFirstSync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM songs WHERE deleted_at IS NOT NULL'
  );
  return r?.count ?? 0;
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
  artistReading: string = '',
  tempoOffset: number | null = null
): number {
  const result = getDb().runSync(
    'INSERT INTO songs (title, artist, key_offset, tempo_offset, artwork_url, memo, title_reading, artist_reading, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, artist, keyOffset, tempoOffset, artworkUrl ?? null, memo, titleReading, artistReading, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

/** 曲そのものの情報（曲名・アーティスト・アート・読み）を更新する。編集画面で使用 */
export function updateSong(
  id: number,
  title: string,
  artist: string,
  artworkUrl: string | null,
  titleReading: string = '',
  artistReading: string = ''
): void {
  getDb().runSync(
    'UPDATE songs SET title = ?, artist = ?, artwork_url = ?, title_reading = ?, artist_reading = ? WHERE id = ?',
    [title, artist, artworkUrl, titleReading, artistReading, id]
  );
}

/** 歌い方の情報（キー・テンポ・メモ）。曲詳細でその場で更新する */
export type SongSingingInfo = {
  key_offset: number | null;
  tempo_offset: number | null;
  memo: string;
};

/** 歌い方の情報を部分更新する（指定した項目だけ書き換える） */
export function updateSongSingingInfo(id: number, patch: Partial<SongSingingInfo>): void {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if ('key_offset' in patch) { sets.push('key_offset = ?'); values.push(patch.key_offset ?? null); }
  if ('tempo_offset' in patch) { sets.push('tempo_offset = ?'); values.push(patch.tempo_offset ?? null); }
  if ('memo' in patch) { sets.push('memo = ?'); values.push(patch.memo ?? ''); }
  if (sets.length === 0) return;
  getDb().runSync(`UPDATE songs SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
}

/** 論理削除（ゴミ箱に入れる）。点数・タブ紐づけは保持し、復元で元に戻せる */
export function deleteSong(id: number): void {
  getDb().runSync('UPDATE songs SET deleted_at = ? WHERE id = ?', [new Date().toISOString(), id]);
}

/** ゴミ箱から復元する */
export function restoreSong(id: number): void {
  getDb().runSync('UPDATE songs SET deleted_at = NULL WHERE id = ?', [id]);
}

/** 完全に削除する（点数・タブ紐づけも CASCADE で消える・取り消し不可） */
export function hardDeleteSong(id: number): void {
  getDb().runSync('DELETE FROM songs WHERE id = ?', [id]);
}

/** ゴミ箱内の、削除から days 日より前の曲を完全削除する。削除件数を返す */
export function purgeExpiredDeleted(days: number = 30): number {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const r = getDb().runSync(
    'DELETE FROM songs WHERE deleted_at IS NOT NULL AND deleted_at < ?',
    [cutoff]
  );
  return r.changes;
}

export function findDuplicateSong(
  title: string,
  artist: string,
  excludeId?: number,
): Pick<SongRow, 'id' | 'title' | 'artist'> | null {
  // 編集時は自分自身を比較対象から除外する（除外しないと、変更なしの保存でも警告が出る）
  // ゴミ箱内の曲は重複判定の対象外（再登録を妨げない）
  if (excludeId != null) {
    return getDb().getFirstSync<Pick<SongRow, 'id' | 'title' | 'artist'>>(
      `SELECT id, title, artist FROM songs WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND LOWER(TRIM(artist)) = LOWER(TRIM(?)) AND id != ? AND deleted_at IS NULL LIMIT 1`,
      [title, artist, excludeId]
    );
  }
  return getDb().getFirstSync<Pick<SongRow, 'id' | 'title' | 'artist'>>(
    `SELECT id, title, artist FROM songs WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND LOWER(TRIM(artist)) = LOWER(TRIM(?)) AND deleted_at IS NULL LIMIT 1`,
    [title, artist]
  );
}
