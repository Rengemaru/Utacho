import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDb } from '../db/client';

const SETTINGS_WHITELIST = ['default_machine', 'onboarding_completed'] as const;

// ---- インポート用型定義 ----

type BackupRow = Record<string, unknown>;

export type BackupData = {
  version: string;
  schemaVersion: number;
  exportedAt: string;
  settings: { key: string; value: string }[];
  tabs: BackupRow[];
  songs: BackupRow[];
  song_tabs: BackupRow[];
  scores: BackupRow[];
};

export async function buildBackupJson(): Promise<string> {
  const db = getDb();

  const versionRow = db.getFirstSync<{ version: number }>('SELECT version FROM db_version LIMIT 1');
  const schemaVersion = versionRow?.version ?? 0;

  const allSettings = db.getAllSync<{ key: string; value: string }>(
    'SELECT key, value FROM settings ORDER BY key'
  );
  const settings = allSettings.filter(
    (s) => (SETTINGS_WHITELIST as readonly string[]).includes(s.key)
  );

  const tabs = db.getAllSync('SELECT * FROM tabs ORDER BY id');
  const songs = db.getAllSync('SELECT * FROM songs ORDER BY id');
  const song_tabs = db.getAllSync('SELECT * FROM song_tabs ORDER BY song_id, tab_id');
  const scores = db.getAllSync('SELECT * FROM scores ORDER BY id');

  const backup = {
    version: '1.0',
    schemaVersion,
    exportedAt: new Date().toISOString(),
    settings,
    tabs,
    songs,
    song_tabs,
    scores,
  };

  return JSON.stringify(backup, null, 2);
}

export async function exportBackup(): Promise<void> {
  const json = await buildBackupJson();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `utacho-backup-${ts}.json`;

  const file = new File(Paths.cache, filename);
  file.write(json);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'バックアップを保存',
  });
}

// ---- インポート ----

/** ファイルピッカーを開いてバックアップJSONを読み込む。キャンセル時は null を返す */
export async function readBackupFile(): Promise<BackupData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'public.json'],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const file = new File(result.assets[0].uri);
  const content = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('JSONの解析に失敗しました。ファイルが壊れている可能性があります。');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as BackupData).tabs) ||
    !Array.isArray((parsed as BackupData).songs) ||
    !Array.isArray((parsed as BackupData).song_tabs) ||
    !Array.isArray((parsed as BackupData).scores)
  ) {
    throw new Error('バックアップファイルの形式が正しくありません。');
  }

  return parsed as BackupData;
}

/** 曲・スコア・タブがすべて空のバックアップか（＝復元すると実質全消しになる） */
export function isEmptyBackup(data: BackupData): boolean {
  return data.tabs.length === 0 && data.songs.length === 0 && data.scores.length === 0;
}

/** バックアップデータをDBに書き戻す（既存データはすべて上書き）*/
export function restoreFromBackup(data: BackupData): void {
  const db = getDb();

  db.execSync('BEGIN TRANSACTION');
  try {
    // 既存データを全削除（FK制約のため scores → song_tabs → songs → tabs の順）
    db.execSync('DELETE FROM scores');
    db.execSync('DELETE FROM song_tabs');
    db.execSync('DELETE FROM songs');
    db.execSync('DELETE FROM tabs');

    for (const tab of data.tabs) {
      db.runSync(
        'INSERT INTO tabs (id, name, sort_order) VALUES (?, ?, ?)',
        [tab.id as number, tab.name as string, (tab.sort_order as number) ?? 0]
      );
    }

    for (const song of data.songs) {
      db.runSync(
        'INSERT INTO songs (id, title, artist, key_offset, artwork_url, memo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          song.id as number,
          song.title as string,
          (song.artist as string) ?? '',
          (song.key_offset as number | null) ?? null,
          (song.artwork_url as string | null) ?? null,
          (song.memo as string) ?? '',
          song.created_at as string,
        ]
      );
    }

    for (const st of data.song_tabs) {
      db.runSync(
        'INSERT INTO song_tabs (song_id, tab_id) VALUES (?, ?)',
        [st.song_id as number, st.tab_id as number]
      );
    }

    for (const score of data.scores) {
      // machine がないスコアはスキップ（古い形式のバックアップ対策）
      if (!score.machine) continue;
      db.runSync(
        'INSERT INTO scores (id, song_id, score, scored_at, machine) VALUES (?, ?, ?, ?, ?)',
        [
          score.id as number,
          score.song_id as number,
          score.score as number,
          score.scored_at as string,
          score.machine as string,
        ]
      );
    }

    for (const s of (data.settings ?? [])) {
      if ((SETTINGS_WHITELIST as readonly string[]).includes(s.key)) {
        db.runSync(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [s.key, s.value]
        );
      }
    }

    db.execSync('COMMIT');
  } catch (e) {
    db.execSync('ROLLBACK');
    throw e;
  }
}
