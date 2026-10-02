// ---- iTunes Search API のサジェスト結果 ----
export interface MusicSuggestion {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl: string | null;
  collectionName: string;
}

// ---- DB から取得したままの形（snake_case） ----
export interface SongRow {
  id: number;
  title: string;
  artist: string;
  key_offset: number | null;
  artwork_url: string | null;
  memo: string;
  created_at: string;
}

export interface TabRow {
  id: number;
  name: string;
  sort_order: number;
}

export interface TabWithCount extends TabRow {
  song_count: number;
}

export interface ScoreRow {
  id: number;
  song_id: number;
  score: number;
  scored_at: string;
  machine: string;
}

// ---- アプリ内で使う集計済みの形 ----
export interface SongWithStats extends SongRow {
  best_score: number | null;
  latest_score: number | null;
  first_score: number | null;
  latest_scored_at: string | null;
  score_count: number;
  tabs: TabRow[];
}
