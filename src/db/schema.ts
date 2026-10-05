export const schema = `
  CREATE TABLE IF NOT EXISTS tabs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS songs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    artist      TEXT    NOT NULL DEFAULT '',
    key_offset  INTEGER,
    artwork_url TEXT,
    memo        TEXT    NOT NULL DEFAULT '',
    title_reading  TEXT NOT NULL DEFAULT '',
    artist_reading TEXT NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL
  );
  CREATE TABLE IF NOT EXISTS song_tabs (
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    tab_id  INTEGER NOT NULL REFERENCES tabs(id)  ON DELETE CASCADE,
    PRIMARY KEY (song_id, tab_id)
  );
  CREATE TABLE IF NOT EXISTS scores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id   INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    score     REAL    NOT NULL,
    scored_at TEXT    NOT NULL,
    machine   TEXT    NOT NULL CHECK (machine IN ('DAM', 'JOYSOUND'))
  );
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;
