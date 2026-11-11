import * as SQLite from 'expo-sqlite';
import { AppState, Platform } from 'react-native';
import { schema } from './schema';
import { runMigrations } from './migrations';

const DB_NAME = 'mykara.db';

let _db: SQLite.SQLiteDatabase | null = null;
// フォアグラウンド復帰後に一度だけ接続を検査するためのフラグ。
// 通常操作では検査を挟まずオーバーヘッドを出さない。
let _needsCheck = false;
let _appStateBound = false;

// DB接続を開き、PRAGMA・スキーマ適用まで同期で行う。
// schema は CREATE TABLE IF NOT EXISTS のため、既存DBに再適用しても安全。
function openSync(): SQLite.SQLiteDatabase {
  const db = SQLite.openDatabaseSync(DB_NAME);
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(schema);
  return db;
}

export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') return;
  _db = openSync();
  await runMigrations(_db);

  // フォアグラウンド復帰時に接続を検査し直す（バックグラウンド中にネイティブ側の
  // SQLite接続だけが破棄され、JS側の _db が無効な参照を持ち続けるケースへの保険）。
  // リスナーは一度だけ登録する。
  if (!_appStateBound) {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') _needsCheck = true;
    });
    _appStateBound = true;
  }
}

// 接続が生きているか軽量に確認する。ネイティブ側が破棄されていると prepareSync が
// NullPointerException になるため、ここで捕捉して false を返す。
function isAlive(db: SQLite.SQLiteDatabase): boolean {
  try {
    db.getFirstSync('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// DB インスタンスはシングルトン。未初期化時はエラーをスロー。
// フォアグラウンド復帰直後のみ接続の生存を検査し、無効なら同期で開き直す。
// 既存DBファイルはマイグレーション済みのため、再オープン（PRAGMA＋スキーマ）で復旧できる。
export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  if (_needsCheck) {
    _needsCheck = false;
    if (!isAlive(_db)) {
      _db = openSync();
    }
  }
  return _db;
}
