# 歌帳 — Claude Code 指示書

> **このファイルはClaude Codeへの完全な指示書です。**
> 開発者（オーナー）はExpo学習を兼ねて個人開発しています。
> 実装の前に必ずこのファイル全体を読んでから作業を開始してください。

> **ワイヤーフレーム参照（正）**: `docs/wireframe/歌帳 ワイヤーフレーム v6.html`
> UI実装時は必ずこのワイヤーフレームをデザイン基準として参照すること。
> ※ 旧版 `docs/wireframes/`（v3 / v5）はアーカイブ。正は v6（`docs/wireframe/`）。

---

## 0. プロジェクト概要

| 項目 | 内容 |
|---|---|
| アプリ名 | 歌帳 |
| 概要 | カラオケの持ち歌・点数を管理するモバイルアプリ |
| 現在のターゲット | **Google Play（Android）で先行公開** |
| 将来のターゲット | App Store（iOS）※後続フェーズで対応 |
| 開発OS | Windows / macOS（両方で開発） |
| 開発者スキル | Expo初学者・React Native未経験 |
| 優先順位 | 品質 > 納期 > コスト |

---

## 1. 確定技術スタック

| 役割 | 選定 | 理由 |
|---|---|---|
| フレームワーク | React Native 0.86 + Expo (SDK 57) | クラウドビルド（EAS）でOSを問わずビルドできる |
| 画面遷移 | expo-router (SDK 57 準拠・`~57.0.x`) | ファイルベースルーティング |
| ローカルDB | expo-sqlite | SQL・多対多・CASCADE削除が必要なため |
| グラフ | react-native-gifted-charts | 点数推移の折れ線グラフ（data/data2で2系列対応） |
| 曲情報補完 | iTunes Search API | 無料・申請不要（MVP実装済み） |
| ファイル共有 | expo-sharing + expo-file-system | バックアップJSON書き出し |
| ビルド | EAS Build | クラウドビルド（ローカルOSを問わない） |
| 提出 | EAS Submit | 開発OS（Windows / macOS）いずれからも申請可能 |
| 言語 | TypeScript（strict mode） | 型安全を最重視 |

---

## 2. ディレクトリ構成

```
Utacho/                           # リポジトリルート（アプリ slug / scheme は旧名 mykara のまま。§4 報告参照）
├── app/                          # expo-router のルート（画面ファイル）
│   ├── (tabs)/
│   │   ├── _layout.tsx           # タブナビゲーションのレイアウト
│   │   ├── index.tsx             # 01 ホーム（曲一覧）
│   │   └── settings.tsx          # 05 設定
│   ├── song/
│   │   ├── [id].tsx              # 02 曲詳細
│   │   └── new.tsx               # 04 曲登録・編集（モーダル）
│   ├── settings/
│   │   └── machine.tsx           # デフォルト機種選択
│   ├── tabs.tsx                  # タブ管理
│   ├── help.tsx                  # ヘルプ画面（helpContent.ts を表示）
│   ├── onboarding.tsx            # 初回オンボーディング
│   └── _layout.tsx               # ルートレイアウト（MachineProvider・オンボーディングガード）
├── src/
│   ├── db/
│   │   ├── client.ts             # DB接続・初期化・マイグレーション呼び出し（getDb()でシングルトン取得）
│   │   ├── schema.ts             # テーブル定義SQL（新規インストール用ベースライン）
│   │   ├── migrations/
│   │   │   └── index.ts          # マイグレーション定義・ランナー
│   │   ├── songs.ts              # Song CRUD関数
│   │   ├── tabs.ts               # Tab CRUD関数
│   │   ├── scores.ts             # Score CRUD関数
│   │   ├── songTabs.ts           # song_tabs 操作関数
│   │   ├── settings.ts           # settings テーブルCRUD（AsyncStorage不使用）
│   │   ├── maintenance.ts        # データ保守（全削除・復元時のトランザクション処理など）
│   │   ├── mockData.ts           # 開発用モックデータ
│   │   └── seed.ts               # 開発用seedデータ
│   ├── types/
│   │   └── index.ts              # 全型定義（Song / Tab / Score / Machine）
│   ├── hooks/
│   │   ├── useSongs.ts           # 曲一覧取得フック
│   │   ├── useSongDetail.ts      # 曲詳細・スコア取得フック
│   │   ├── useTabs.ts            # タブ一覧取得フック
│   │   └── useMusicSearch.ts     # 【レガシー】1.0.x のインライン候補用。1.1.0 で検索モーダルに移行し未使用
│   ├── contexts/
│   │   └── MachineContext.tsx    # 現在機種のReact Context
│   ├── constants/
│   │   ├── colors.ts             # デザイントークン（カラー定義）
│   │   ├── fonts.ts              # デザイントークン（フォント定義）
│   │   └── tabConfig.ts          # タブ関連の定数（「すべて」「今日」タブ等）
│   ├── data/
│   │   └── helpContent.ts        # ヘルプ画面の文言データ（セクション・エントリ）
│   ├── lib/
│   │   ├── machine.ts            # 機種ロジック・セッション管理・オンボーディング
│   │   ├── backup.ts             # バックアップJSON構築・共有シート起動・インポート復元
│   │   ├── text.ts               # かな正規化（ひらがな/カタカナ・全角半角・大文字小文字）ローカル検索用
│   │   ├── text.test.ts          # text.ts の単体テスト（Jest）
│   │   └── datetime.ts           # 日付ユーティリティ（ローカル日付・セッション日付など）
│   ├── api/
│   │   └── itunesSearch.ts       # 【レガシー】1.0.x のクライアント。1.1.0 は features/songSearch/itunes.ts を使用
│   ├── features/
│   │   └── songSearch/           # 1.1.0 曲検索モーダル（検索フロー再設計）
│   │       ├── types.ts          # SearchMode / SortKey / SearchStatus / SongCandidate / SearchResult
│   │       ├── constants.ts      # FETCH_LIMIT=200 / PAGE_SIZE=50 / DEBOUNCE_MS=300 / country=JP / lang=ja_jp
│   │       ├── itunes.ts         # iTunes 検索（成功/失敗を型で返す）
│   │       ├── logic.ts          # 純粋関数（状態判定・並び替え・ページング・初期クエリ）
│   │       ├── logic.test.ts     # 純粋関数の単体テスト（Jest）
│   │       ├── useSongSearch.ts  # 検索状態フック（デバウンス・stale防止・retry）
│   │       └── SongSearchModal.tsx # 検索モーダル本体（04a 選択・04b 検索）
│   └── components/
│       ├── SongCard.tsx          # 曲カード（ホーム用）
│       ├── SearchResultList.tsx  # 検索候補の汎用リスト（FlatList・toRowで任意型対応）
│       ├── ScoreBottomSheet.tsx  # 点数入力・編集ボトムシート（機種トグル付き）
│       ├── ScoreChart.tsx        # 折れ線グラフ（gifted-charts、曲詳細トグルで選択機種1系列 #71）
│       ├── SetlistModal.tsx      # 今日のセットリスト選曲モーダル
│       ├── RandomPickModal.tsx   # ランダム選曲モーダル（範囲選択）
│       ├── CoachMark.tsx         # コーチマーク（操作ガイドの吹き出し）
│       ├── FirstLaunchGuide.tsx  # 初回起動ガイド
│       ├── KeyStepper.tsx        # キー（音域）ステッパー
│       └── EmptyState.tsx        # 空状態・ローディング・エラー表示
├── assets/
├── app.json
├── eas.json
├── tsconfig.json
└── package.json
```

---

## 3. データ設計

### 3-1. テーブル定義（現在の完全スキーマ）

```sql
-- タブ（カテゴリ）
CREATE TABLE IF NOT EXISTS tabs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 曲
CREATE TABLE IF NOT EXISTS songs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  artist      TEXT    NOT NULL DEFAULT '',
  key_offset  INTEGER,                    -- NULL=未設定、+2、-1 など整数
  artwork_url TEXT,                       -- iTunes APIから取得
  memo        TEXT    NOT NULL DEFAULT '', -- メモ（自由入力）
  title_reading  TEXT NOT NULL DEFAULT '', -- 曲名の読み（手入力・任意・ローカル検索用）
  artist_reading TEXT NOT NULL DEFAULT '', -- アーティストの読み（手入力・任意）
  created_at  TEXT    NOT NULL            -- ISO8601（例: "2026-05-25T21:00:00"）
);

-- 曲↔タブ 中間テーブル（多対多）
CREATE TABLE IF NOT EXISTS song_tabs (
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  tab_id  INTEGER NOT NULL REFERENCES tabs(id)  ON DELETE CASCADE,
  PRIMARY KEY (song_id, tab_id)
);

-- 点数履歴
CREATE TABLE IF NOT EXISTS scores (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id   INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  score     REAL    NOT NULL,             -- 小数・整数どちらも対応（例: 92.450）
  scored_at TEXT    NOT NULL,             -- 記録日（例: "2026-05-25"）
  machine   TEXT    NOT NULL              -- 'DAM' or 'JOYSOUND'（DEFAULT なし・必須）
    CHECK (machine IN ('DAM', 'JOYSOUND'))
);

-- アプリ設定（キー・バリュー形式）
-- ⚠️ AsyncStorage は使用禁止。すべて settings テーブルで管理する
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- マイグレーション管理
CREATE TABLE IF NOT EXISTS db_version (
  version INTEGER NOT NULL
);
```

**settings テーブルのキー一覧**

| key | 内容 | 備考 |
|---|---|---|
| `default_machine` | デフォルト機種（`DAM` または `JOYSOUND`） | 設定画面で変更可 |
| `onboarding_completed` | オンボーディング完了フラグ（`"true"`） | 初回起動後に書き込み |
| `session_machine` | セッション中の機種 | バックアップ対象外 |
| `session_date` | セッション日付（ローカル日付 YYYY-MM-DD） | バックアップ対象外 |

### 3-2. マイグレーション機構

- `src/db/migrations/index.ts` にマイグレーション定義を配列で管理
- `db_version` テーブルで適用済みバージョンを追跡
- `initDatabase()` 呼び出し時に未適用のマイグレーションを自動実行
- **新しいカラム/テーブルを追加する際は必ずマイグレーションを追加する**
- 現在のマイグレーション：v1（memo列）→ v2（settingsテーブル）→ v3（machine列）→ v4（title_reading/artist_reading列）

### 3-3. 設計方針

| 項目 | 決定内容 |
|---|---|
| 曲↔タブの関係 | 多対多。1曲が複数タブに属せる |
| スコアの型 | REAL（小数・整数どちらも対応） |
| 「すべて」タブ | DBに持たずアプリ側コードで固定表示。削除・編集不可 |
| タブ | 自由記述・カスタム命名 |
| 曲削除時 | scores・song_tabs も連鎖削除（ON DELETE CASCADE） |
| タブ削除時 | song_tabs の該当行のみ削除。曲自体は残る |
| 永続化 | **AsyncStorage 使用禁止**。すべて settings テーブルを使う |
| セッション機種 | session_machine + session_date で当日限り記憶（翌日はdefaultに戻る） |

---

## 4. 型定義（`src/types/index.ts`）

```typescript
// ---- DB から取得したままの形（snake_case） ----
export interface SongRow {
  id: number;
  title: string;
  artist: string;
  key_offset: number | null;
  artwork_url: string | null;
  memo: string;
  title_reading: string;   // 曲名の読み（手入力・任意・空可）
  artist_reading: string;  // アーティストの読み（手入力・任意・空可）
  created_at: string;
}

export interface TabRow {
  id: number;
  name: string;
  sort_order: number;
}

export interface ScoreRow {
  id: number;
  song_id: number;
  score: number;
  scored_at: string;
  machine: string;  // 'DAM' | 'JOYSOUND'
}

// ---- アプリ内で使う集計済みの形 ----
export interface SongWithStats extends SongRow {
  best_score: number | null;   // 最高スコア
  latest_score: number | null; // 最新スコア
  score_count: number;          // 記録回数
  tabs: TabRow[];               // 紐づくタブ一覧
}

// ---- 機種 ----
export type Machine = 'DAM' | 'JOYSOUND';
export const MACHINES: readonly Machine[] = ['DAM', 'JOYSOUND'];
```

---

## 5. DB実装サンプル

### 5-1. DB初期化（`src/db/client.ts`）

```typescript
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { schema } from './schema';
import { runMigrations } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') return;
  _db = SQLite.openDatabaseSync('mykara.db');
  _db.execSync('PRAGMA foreign_keys = ON;');
  _db.execSync(schema);
  await runMigrations(_db);
}

// DB インスタンスはシングルトン。未初期化時はエラーをスロー
export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}
```

### 5-2. スキーマ（`src/db/schema.ts`）

```typescript
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
```

### 5-3. Song CRUD（`src/db/songs.ts`）

```typescript
import { getDb } from './client';
import { SongRow, SongWithStats } from '../types';

/** 全曲取得（最高スコア・最新スコア・記録回数をJOINで集計） */
export function getAllSongs(): SongWithStats[] {
  return getDb().getAllSync<SongWithStats>(`
    SELECT
      s.*,
      MAX(sc.score)  AS best_score,
      (SELECT score FROM scores WHERE song_id = s.id ORDER BY scored_at DESC LIMIT 1) AS latest_score,
      COUNT(sc.id)   AS score_count
    FROM songs s
    LEFT JOIN scores sc ON sc.song_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);
}

/** タブ別曲取得 */
export function getSongsByTab(tabId: number): SongWithStats[] {
  return getDb().getAllSync<SongWithStats>(`
    SELECT
      s.*,
      MAX(sc.score)  AS best_score,
      (SELECT score FROM scores WHERE song_id = s.id ORDER BY scored_at DESC LIMIT 1) AS latest_score,
      COUNT(sc.id)   AS score_count
    FROM songs s
    JOIN song_tabs st ON st.song_id = s.id
    LEFT JOIN scores sc ON sc.song_id = s.id
    WHERE st.tab_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, [tabId]);
}

/** 曲を1件登録 */
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
    `INSERT INTO songs (title, artist, key_offset, artwork_url, memo, title_reading, artist_reading, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, artist, keyOffset, artworkUrl ?? null, memo, titleReading, artistReading, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

/** 曲を更新 */
export function updateSong(
  id: number,
  title: string,
  artist: string,
  keyOffset: number | null,
  artworkUrl?: string | null,
  memo: string = ''
): void {
  getDb().runSync(
    `UPDATE songs SET title = ?, artist = ?, key_offset = ?, artwork_url = ?, memo = ? WHERE id = ?`,
    [title, artist, keyOffset, artworkUrl ?? null, memo, id]
  );
}

/** 曲を削除（scores・song_tabsも連鎖削除） */
export function deleteSong(id: number): void {
  getDb().runSync(`DELETE FROM songs WHERE id = ?`, [id]);
}
```

### 5-4. song_tabs 操作（`src/db/songTabs.ts`）

```typescript
import { getDb } from './client';
import { TabRow } from '../types';

/** 曲に紐づくタブ一覧を取得 */
export function getTabsBySong(songId: number): TabRow[] {
  return getDb().getAllSync<TabRow>(
    `SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?`,
    [songId]
  );
}

/** 曲とタブを紐づける */
export function attachTab(songId: number, tabId: number): void {
  getDb().runSync(
    `INSERT OR IGNORE INTO song_tabs (song_id, tab_id) VALUES (?, ?)`,
    [songId, tabId]
  );
}

/** 曲からタブの紐づけを外す */
export function detachTab(songId: number, tabId: number): void {
  getDb().runSync(
    `DELETE FROM song_tabs WHERE song_id = ? AND tab_id = ?`,
    [songId, tabId]
  );
}

/** 曲のタブを一括更新（登録・編集フォームで使用） */
export function syncTabs(songId: number, tabIds: number[]): void {
  // いったん全削除して貼り直す（差分管理より単純で安全）
  getDb().runSync(`DELETE FROM song_tabs WHERE song_id = ?`, [songId]);
  for (const tabId of tabIds) {
    attachTab(songId, tabId);
  }
}
```

---

## 6. 画面仕様

### 6-1. 画面一覧

| No. | 画面名 | ファイルパス |
|---|---|---|
| 01 | ホーム（曲一覧） | `app/(tabs)/index.tsx` |
| 01b | 曲カード左スワイプ | 01の中で制御 |
| 02 | 曲詳細 | `app/song/[id].tsx` |
| 02b | 点数編集（ボトムシート） | 02の中で制御 |
| 03 | 点数入力（ボトムシート） | 01・02の中で制御 |
| 04 | 曲登録・編集（モーダル） | `app/song/new.tsx` |
| 05 | 設定 | `app/(tabs)/settings.tsx` |

### 6-2. 画面遷移フロー

```
ホーム（01）
├─ 曲カードをタップ              → 02 曲詳細
├─ 曲カードの ✏️ をタップ        → 03 点数入力ボトムシート（新規）
├─ 曲カードを左スワイプ
│   ├─ [✏️ 編集]               → 04 曲編集フォーム（入力済み）
│   └─ [🗑 削除]               → 確認ダイアログ → 削除
└─ ＋ボタンをタップ              → 04 曲登録

曲詳細（02）
├─ 「点数を記録する」ボタン       → 03 点数入力ボトムシート（新規）
└─ 履歴行を左スワイプ
    ├─ [✏️ 編集]               → 02b 点数編集ボトムシート（入力済み）
    └─ [🗑 削除]               → 確認ダイアログ → 削除

ボトムナビ
├─ ♪ 曲一覧                   → 01 ホーム
└─ ⚙️ 設定                    → 05 設定
```

### 6-3. デザイントークン

```typescript
// 色
const colors = {
  accent:      '#5b4cf5',  // メインカラー（パープル）
  accentSoft:  'rgba(91, 76, 245, 0.10)',
  green:       '#00b96b',  // キー正・スコア上昇
  yellow:      '#f59e0b',  // キー負
  red:         '#ef4444',  // 削除ボタン
  text:        '#111827',
  text2:       '#6b7280',
  text3:       '#9ca3af',
  bg:          '#f0f2f7',
  surface:     '#f7f8fc',
  surface2:    '#eef0f6',
  border:      'rgba(0, 0, 0, 0.07)',
  white:       '#ffffff',
};

// フォント（expo-google-fontsで導入）
// - Plus Jakarta Sans: 見出し・アプリタイトル
// - Noto Sans JP: 本文・日本語
// - DM Mono: 数字・スコア表示
```

### 6-4. 各画面の実装仕様

#### 01 ホーム（曲一覧）

- ヘッダー: `歌帳`（Plus Jakarta Sans / 22px / Bold）+ ＋ボタン（右上・アクセント背景）
- タブ: 横スクロール。「すべて」タブは先頭固定・削除不可
- 検索バー: 曲名・アーティスト名でクライアントサイドフィルタリング
- 曲カード構成:
  ```
  [アート40px] [曲名（ellipsis）]  [キーバッジ] [スコア DM Mono] [✏️ボタン]
               [アーティスト名（ellipsis）]
  ```
- キーバッジ: `+n` → 緑、`-n` → 黄、未設定 → 非表示（幅は確保）
- 左スワイプ: `[✏️ 編集]`（accent色）`[🗑 削除]`（red色）の2ボタン
- 空状態: 「まだ曲がありません」+「＋ 最初の曲を追加する」ボタン

#### 02 曲詳細

- ヘッダー: 戻るボタン + 曲名 + アーティスト名
- DAM/JOYSOUND トグル: 最高点カード・グラフの対象機種を切替（初期＝デフォルト機種・#71）
- 最高スコアカード: 選択機種の最高スコア + 前回比（±pt）+ 記録回数（すべて機種別）
- 点数推移グラフ: 選択機種の1系列（gifted-charts。2件以上で表示）
- 記録履歴リスト: 日付・スコア（全機種・機種バッジ付き）。左スワイプで `[✏️ 編集]` `[🗑 削除]`
- 下部固定: `🎤 点数を記録する` ボタン（accent色）

#### 03 点数入力ボトムシート（新規）/ 02b 点数編集ボトムシート（編集）

- 曲詳細画面の上にオーバーレイ（背景暗転）
- ハンドル → 曲名 → スコア表示欄 → テンキー（3×4） → 日付 → 実行ボタン
- テンキー: `1〜9`, `.`, `0`, `⌫`
- 編集時は既存スコア・日付が入力済みで開く
- ボタンラベル: 新規→「記録する」、編集→「変更を保存する」

#### 04 曲登録・編集（共通フォーム）

> 1.1.0 で曲の追加・編集フローを検索モーダル方式に再設計。新規追加は「＋」→ 検索モーダル（04a 選択 / 04b 検索）→ フォーム。フォームの曲名・アーティストは**サジェストなしのテキスト欄**（インライン候補は廃止）。詳細は `docs/spec~1.1.0/spec-1.1.0-song-flow.md`。

- 入力項目:
  1. 曲名（テキスト入力。検索モーダルで選ぶと自動入力される）
  2. アーティスト名（テキスト入力）
  3. タブ選択（複数選択可。選択済みはアクセント色。「＋ 新規作成」も表示）
  4. キー（音域）ステッパー: `－` / 値 / `＋`。未設定可能
- 編集フォームには「曲を変更」ボタン（別の曲へ差し替え。キー・メモ・タブ・点数は引き継ぐ）
- 保存時に重複登録チェック（新規・編集とも。編集は自分自身を除外）
- 下部固定ボタン: 新規→「曲を追加する」、編集→「変更を保存する」

#### 05 設定

- タブ管理: 追加・名前変更・削除・並び替え
- 表示設定: 曲の並び順（登録順 / 名前順 / スコア順）
- データ管理: 全データ削除（赤字・確認ダイアログ必須）
- アプリ情報: バージョン・プライバシーポリシー

---

## 7. 実装ルール（厳守）

### コーディングルール

```
1. TypeScript strict mode を必ず有効にする（tsconfig.json の "strict": true）
2. any 型は使用禁止。型が不明なときは unknown を使い、型ガードで絞る
3. DB操作関数はすべて src/db/ に集約する（画面コンポーネントから直接DBを叩かない）
4. カスタムフック（src/hooks/）でDBアクセスとUIロジックを分離する
5. コンポーネントは1ファイル1コンポーネント
6. マジックナンバーは定数化する（例: const MAX_SCORE = 100）
7. 削除操作は必ず確認ダイアログを挟む
8. エラー発生時は console.error でログを出し、UIにもエラーメッセージを表示する
```

### 「すべて」タブのルール

```typescript
// すべてタブはDBに持たない。コードで固定定義する
export const ALL_TAB = { id: -1, name: 'すべて', sort_order: -1 } as const;
// id が -1 のときは全曲取得クエリを使う
// id が -1 のタブは削除・編集UIに表示しない
```

### PRAGMA foreign_keys の注意点

expo-sqlite は接続のたびに外部キー制約がリセットされる。
`initDatabase()` を呼ぶだけでなく、**アプリ起動時に必ず1回実行する**こと。

---

## 8. WBSとタスク詳細

### Git運用ルール（重要）

```
- 1タスク完了ごとに必ずコミットする
- コミット後、このファイルに記載のコミットメッセージをそのまま使う
- ブランチ戦略: feature/<機能名> ブランチを切り、完了後 main へ PR・マージ
- コミットメッセージ形式: [タスクNo] 日本語で内容を説明
- google-services-key.json は .gitignore に追加済み。絶対にコミットしない
```

---

### Phase 0: 環境構築・Expo体験（20h）

> **このフェーズの目的**: 実装より先に「Expoとはどういうものか」を体感する。
> 動くものを触ることでモチベーションを維持し、Phase 1以降の学習コストを下げる。

#### 0-1: Node.js / Expo CLI インストール（1h）

```powershell
# Node.js (LTS版) をインストール後、以下を実行
node -v   # v20以上であることを確認
npm install -g eas-cli
npx expo --version  # インストール確認
```

**完了条件**: `npx expo --version` がバージョン番号を返す

**コミットメッセージ**: なし（ファイル変更なし）

---

#### 0-2: Expoプロジェクト新規作成（1h）

```powershell
npx create-expo-app mykara --template blank-typescript
cd mykara
```

**完了条件**: `mykara/` フォルダが生成され、`app.json` が存在する

**コミットメッセージ**:
```
[0-2] Expoプロジェクト初期作成（blank-typescriptテンプレート）
```

---

#### 0-3: expo-routerの動作確認（2h）

> **学習目的**: expo-routerの「ファイル=画面」という考え方を体感する。

```powershell
npx expo install expo-router react-native-safe-area-context react-native-screens
```

`app/(tabs)/index.tsx` と `app/(tabs)/settings.tsx` を作成し、
ボトムナビで切り替えられることをExpo Goで確認する。

**完了条件**: 実機でタブが2枚切り替えられる

**コミットメッセージ**:
```
[0-3] expo-routerでタブナビゲーションの動作確認
```

---

#### 0-4: EAS CLI インストール・ログイン（1h）

```powershell
eas login
eas build:configure
```

**完了条件**: `eas.json` が生成される

**コミットメッセージ**:
```
[0-4] EAS設定ファイル追加（eas.json）
```

---

#### 0-5: Apple Developer Program 登録（1h）

作業: https://developer.apple.com/programs/ から登録。
審査に数日かかる場合があるため、**Phase 0の最初のタイミングで申し込む**こと。

**完了条件**: Apple Developer Programのステータスが「Active」になる

**コミットメッセージ**: なし（コード変更なし）

---

#### 0-6: SQL基礎学習（4h）

> **クリティカルパス**。ここが詰まるとPhase 1全体がブロックされる。

以下のSQL操作を理解・実行できるようになること:
- `SELECT` / `INSERT` / `UPDATE` / `DELETE`
- `WHERE` による絞り込み
- `JOIN` による複数テーブルの結合
- `LEFT JOIN` と `INNER JOIN` の違い

学習リソース（推奨）: [SQLite Tutorial](https://www.sqlitetutorial.net/)

**完了条件**: 3-1のテーブル定義SQLを読んで、各テーブルの役割が説明できる

**コミットメッセージ**: なし

---

#### 0-7: expo-sqliteの動作確認（2h）

> **クリティカルパス**。

```powershell
npx expo install expo-sqlite
```

簡単なCRUD（`test` テーブルへの insert → select → delete）を実装し、
Expo Goで動作することを確認する。

**完了条件**: `console.log` でDBから取得したデータが出力される

**コミットメッセージ**:
```
[0-7] expo-sqlite動作確認用スクリプト追加
```

---

#### 0-8: TypeScript基礎確認（2h）

以下を理解していること:
- `interface` と `type` の使い分け
- `string | null` などのユニオン型
- 関数の引数・戻り値の型注釈
- `as const` の使い方

**完了条件**: `src/types/index.ts` を読んで各型の意味が説明できる

**コミットメッセージ**: なし

---

#### 0-9: Victory Native インストール・グラフ表示確認（2h）

> ⚠️ ExpoとVictory Nativeの相性問題が報告されている。早めに確認必須。

```powershell
npx expo install victory-native react-native-reanimated react-native-gesture-handler
```

折れ線グラフ（`VictoryLine`）を1枚の画面に表示してみる。
**インストールエラーが出た場合**: 代替ライブラリ `react-native-gifted-charts` を使用する。

**完了条件**: 画面にグラフが表示される

**コミットメッセージ**:
```
[0-9] Victory Native動作確認（グラフ表示テスト）
```

---

#### 0-10: Git初期設定・GitHubリポジトリ作成（2h）

```powershell
git init
git remote add origin <GitHubリポジトリURL>
```

`.gitignore` に以下を必ず追加:
```
node_modules/
.expo/
*.env
```

**完了条件**: GitHubにコードがpushされている

**プルリクエスト**:
- タイトル: `[Phase 0] 環境構築・Expo動作確認`
- Description:
  ```
  ## 変更内容
  - Expoプロジェクト初期作成
  - expo-router タブナビゲーション動作確認
  - EAS設定ファイル追加
  - expo-sqlite 動作確認
  - Victory Native グラフ表示確認

  ## 確認事項
  - [ ] Expo Goで実機動作する
  - [ ] タブが2枚切り替えられる
  - [ ] DBへのCRUDが動作する
  - [ ] グラフが表示される
  ```

---

### Phase 1: データ層の実装（22h）

> **このフェーズの目的**: UIより先にDB操作ロジックを完成させる。
> 土台を固めることで、Phase 2のUI実装がスムーズになる。

#### 1-1: 型定義ファイル作成（1h）

`src/types/index.ts` を作成し、セクション4の型定義をそのまま実装する。

**完了条件**: TypeScriptのコンパイルエラーが0件

**コミットメッセージ**:
```
[1-1] 型定義ファイル作成（Song / Tab / Score / SongWithStats）
```

---

#### 1-2: DBスキーマ定義ファイル作成（1h）

`src/db/schema.ts` を作成し、セクション3-1のSQLをそのまま実装する。

**完了条件**: ファイルが存在し、TypeScriptエラーがない

**コミットメッセージ**:
```
[1-2] DBスキーマ定義ファイル作成（4テーブル）
```

---

#### 1-3: DB初期化処理の実装（2h）

`src/db/client.ts` を作成し、セクション5-1のサンプルをそのまま実装する。
`app/_layout.tsx` でアプリ起動時に `initDatabase()` を呼び出す。

> ⚠️ `PRAGMA foreign_keys = ON` を忘れると ON DELETE CASCADE が動作しない。

**完了条件**: アプリ起動時にDBが初期化され、エラーが出ない

**コミットメッセージ**:
```
[1-3] DB初期化処理の実装（expo-sqlite・PRAGMA foreign_keys有効化）
```

---

#### 1-4: Tabのデータ操作関数（CRUD）実装（2h）

`src/db/tabs.ts` を作成し、以下の関数を実装する:

```typescript
getAllTabs(): TabRow[]
insertTab(name: string): number
updateTab(id: number, name: string): void
deleteTab(id: number): void
updateTabOrder(tabs: { id: number; sort_order: number }[]): void
```

**完了条件**: 各関数を手動で呼び出して動作確認できる

**コミットメッセージ**:
```
[1-4] タブ（Tab）のCRUD関数実装
```

---

#### 1-5: Songのデータ操作関数（CRUD）実装（2h）

`src/db/songs.ts` を作成し、セクション5-3のサンプルをそのまま実装する。

**完了条件**: `getAllSongs()` が空配列を返す（テーブルが存在する証拠）

**コミットメッセージ**:
```
[1-5] 曲（Song）のCRUD関数実装（集計クエリ含む）
```

---

#### 1-6: Scoreのデータ操作関数（CRUD）実装（2h）

`src/db/scores.ts` を作成し、以下の関数を実装する:

```typescript
getScoresBySong(songId: number): ScoreRow[]
insertScore(songId: number, score: number, scoredAt: string): number
updateScore(id: number, score: number, scoredAt: string): void
deleteScore(id: number): void
```

**完了条件**: 各関数を手動で呼び出して動作確認できる

**コミットメッセージ**:
```
[1-6] 点数（Score）のCRUD関数実装
```

---

#### 1-7: song_tabsのデータ操作関数実装（2h）

`src/db/songTabs.ts` を作成し、セクション5-4のサンプルをそのまま実装する。

**完了条件**: `syncTabs(songId, [tabId1, tabId2])` が正しく動く

**コミットメッセージ**:
```
[1-7] 曲↔タブ中間テーブル（song_tabs）の操作関数実装
```

---

#### 1-8: タブ別曲取得クエリの実装（1h）

`getSongsByTab` はセクション5-3に含まれている。
動作確認として、タブを1件作成し、曲を登録・紐づけして取得できることを確認する。

**完了条件**: タブ別フィルタリングが正しく動く

**コミットメッセージ**:
```
[1-8] タブ別曲取得クエリの動作確認
```

---

#### 1-9: カスタムフック作成（3h）

`src/hooks/useSongs.ts`:
```typescript
// 画面が開いたときにDBから曲一覧を取得するフック
export function useSongs(tabId: number) {
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setLoading(true);
      const data = tabId === ALL_TAB.id ? getAllSongs() : getSongsByTab(tabId);
      setSongs(data);
    } catch (e) {
      setError('データの取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tabId]);

  useEffect(() => { reload(); }, [reload]);

  return { songs, loading, error, reload };
}
```

同様に `useSongDetail.ts` / `useTabs.ts` を実装する。

**完了条件**: フックが型エラーなしで実装される

**コミットメッセージ**:
```
[1-9] カスタムフック作成（useSongs / useSongDetail / useTabs）
```

---

#### 1-10: データ操作の動作確認テスト（2h）

画面を作らずに、`_layout.tsx` や仮の画面から各CRUD関数を手動で呼び出し、
以下のシナリオが正しく動くことを確認する:

1. タブを2件作成 → 取得 → 1件削除
2. 曲を1件登録 → 2つのタブに紐づけ → タブ別取得
3. スコアを3件登録 → 最高スコア集計確認
4. 曲を削除 → scores・song_tabsも連鎖削除されることを確認

**完了条件**: 上記4シナリオがすべて正常動作する

**コミットメッセージ**:
```
[1-10] データ層の動作確認テスト完了
```

**プルリクエスト**:
- タイトル: `[Phase 1] データ層の実装完了`
- Description:
  ```
  ## 変更内容
  - 型定義ファイル作成（Song / Tab / Score / SongWithStats）
  - DBスキーマ定義（4テーブル）
  - DB初期化処理（PRAGMA foreign_keys有効化）
  - Song / Tab / Score / song_tabs の CRUD関数実装
  - カスタムフック実装（useSongs / useSongDetail / useTabs）

  ## 確認事項
  - [ ] PRAGMA foreign_keys が有効（CASCADE削除が動く）
  - [ ] タブ別曲取得クエリが正しく動く
  - [ ] 曲削除時にscores・song_tabsも削除される
  - [ ] TypeScriptコンパイルエラー0件
  ```

---

### Phase 2: 画面・UI実装（30h）

> 各タスクはセクション6の画面仕様を必ず参照すること。
> デザイントークンはセクション6-3を使う。

| # | タスク | 目安時間 | コミットメッセージ |
|---|---|---|---|
| 2-1 | タブバー画面の骨格実装（expo-router） | 2h | `[2-1] ボトムナビゲーション骨格実装` |
| 2-2 | ホーム：曲一覧画面（FlatList） | 2h | `[2-2] ホーム曲一覧画面実装` |
| 2-3 | ホーム：タブ横スクロール切り替え | 1h | `[2-3] タブ横スクロール切り替え実装` |
| 2-4 | 曲登録・編集フォーム画面 | 2h | `[2-4] 曲登録・編集フォーム実装` |
| 2-5 | 曲カード左スワイプ（編集・削除） | 2h | `[2-5] 曲カード左スワイプアクション実装` |
| 2-6 | 点数入力ボトムシート（新規） | 2h | `[2-6] 点数入力ボトムシート実装` |
| 2-7 | 点数編集ボトムシート（編集） | 1h | `[2-7] 点数編集ボトムシート実装` |
| 2-8 | 曲詳細画面（最高スコア・履歴） | 2h | `[2-8] 曲詳細画面実装` |
| 2-9 | 点数推移グラフ（gifted-charts） | 2h | `[2-9] 点数推移グラフ実装` |
| 2-10 | 履歴行左スワイプ（編集・削除） | 1h | `[2-10] 履歴行左スワイプアクション実装` |
| 2-11 | タブ管理画面（設定内） | 2h | `[2-11] タブ管理画面実装` |
| 2-12 | 設定画面全体 | 2h | `[2-12] 設定画面実装` |
| 2-13 | 空状態・ローディング・エラーUI | 2h | `[2-13] 空状態・ローディング・エラーUI実装` |
| 2-14 | 全体スタイリング・デザイン調整 | 3h | `[2-14] 全体スタイリング・デザイントークン適用` |
| 2-15 | 画面間導線の最終確認 | 2h | `[2-15] 画面遷移・導線の整合確認` |

**Phase 2完了時プルリクエスト**:
- タイトル: `[Phase 2] 画面・UI実装完了`
- Description: 実装した画面の一覧と、実機確認済みスクリーンショットを添付

---

### Phase 3: 統合・品質担保（10h）

| # | タスク | 目安時間 | コミットメッセージ |
|---|---|---|---|
| 3-1 | 実機での動作確認（Expo Go） | 2h | `[3-1] 実機動作確認・修正` |
| 3-2 | エッジケーステスト | 2h | `[3-2] エッジケーステスト・修正` |
| 3-3 | EAS Build（TestFlight配布） | 2h | `[3-3] EAS Build設定・TestFlight配布` |
| 3-4 | TestFlightで動作確認 | 1h | `[3-4] TestFlight動作確認` |
| 3-5 | バグ修正・仕上げ | 3h | `[3-5] バグ修正・最終調整` |

**Phase 3完了時プルリクエスト**:
- タイトル: `[Phase 3] 統合テスト・品質担保完了`
- Description: 発見したバグと対処内容の一覧

---

### Phase 4: Google Play 公開（現在進行中）

| # | タスク | 状態 | 備考 |
|---|---|---|---|
| 4-A | Google Play デベロッパーアカウント登録 | ⚠️ 要確認 | $25・承認に数日かかる場合あり |
| 4-B | `google-services-key.json` の取得と配置 | ⚠️ 要確認 | Google Play Console → APIアクセス → サービスアカウント作成 → JSONキー配置 |
| 4-C | Google Play Console でアプリ新規作成 | ⚠️ 要確認 | パッケージ名: `com.rengemaru.utacho` |
| 4-D | ストア掲載素材の準備 | ⚠️ 要確認 | スクショ最低2枚・フィーチャーグラフィック1024×500px・説明文 |
| 4-E | コンテンツレーティング（アンケート回答） | ⚠️ 要確認 | Google Play Console 内で完結 |
| 4-F | プライバシーポリシーの作成・URL設定 | ⚠️ 要確認 | 審査で必須 |
| 4-G | データ安全性の回答 | ⚠️ 要確認 | ネット通信あり・個人情報収集なし |
| 4-H | EAS Build（AAB形式） | ⚠️ 要確認 | `eas build --platform android --profile production` |
| 4-I | EAS Submit（内部テスト配布） | ⚠️ 要確認 | `eas submit --platform android --profile production` |
| 4-J | 内部テストで動作確認 | ⚠️ 要確認 | 実機でひと通り操作 |
| 4-K | 一般公開（track を production に変更） | ⚠️ 要確認 | 内部テスト確認後 |

#### ビルド・提出コマンド

> 下記 `eas` コマンドは Windows / macOS どちらのシェルでも同じように実行できる。

```bash
# AABビルド（Google Play必須形式）
eas build --platform android --profile production

# ストアへ提出（内部テスト）
eas submit --platform android --profile production
```

#### `google-services-key.json` の取得手順

1. Google Play Console → 設定 → APIアクセス
2. Googleサービスアカウントを新規作成
3. 権限: 「リリースマネージャー」を付与
4. JSONキーをダウンロード
5. プロジェクトルートに `google-services-key.json` として配置
6. `.gitignore` に追加済みであることを確認

---

## 9. クリティカルパス

> この順番が1タスクでも遅れると、全体のゴールが後ろにズレる最重要ルート。

```
0-6（SQL学習）
→ 0-7（expo-sqlite確認）
→ 1-2（スキーマ定義）
→ 1-3（DB初期化）
→ 1-4〜1-7（CRUD実装）
→ 2-1（タブバー骨格）
→ 2-4（曲登録フォーム）
→ 2-6（点数入力）
→ 2-9（グラフ）
→ 3-3（EAS Build）
→ 4-4（申請）
```

---

## 10. リスクと対策

| リスク | 対策 |
|---|---|
| Victory Native（→ gifted-charts採用済み） | react-native-gifted-charts を使用中。data/data2で2系列対応 |
| expo-sqliteの外部キー制約が動かない | `PRAGMA foreign_keys = ON` を起動時に必ず実行 |
| EAS Buildでエラーが出る | `eas build --platform ios --profile development` から試す |
| Apple Developer審査に時間がかかる | Phase 0の段階で申請開始 |
| 初学者バッファ | 90hの見積もりに対し実際は1.5〜2倍（12〜18週）を想定 |

---

## 11. 実装済み機能（MVP完了）

以下はすべて実装・動作確認済み：

| 機能 | 実装内容 |
|---|---|
| 曲検索モーダル（1.1.0） | 「＋」→ 検索モーダル。曲/アーティスト/キーワードの3モード・並び替え・ページング・4状態表示。候補選択で曲名/アーティスト/アート取り込み。アルバムアート取得（iTunes Search API） |
| 機種選択（DAM / JOYSOUND） | オンボーディング・記録時・設定画面で選択可。セッション記憶付き |
| メモ機能 | 曲登録・編集フォームに自由入力欄。詳細画面に表示 |
| 重複登録チェック | 新規・編集の保存時に確認ダイアログ（大文字小文字・スペース無視。編集は自身を除外） |
| バックアップ（JSONエクスポート） | 全テーブルをJSON書き出し・共有シートで保存先選択 |
| バックアップ（JSONインポート） | DocumentPickerでファイル選択・バリデーション・トランザクション復元 |
| 詳細画面アートワーク | 曲詳細にiTunesアートワーク64x64表示（fallback: 🎵） |
| グラフ（DAM/JOYSOUND 機種別） | 曲詳細のトグルで選択した機種の1系列を表示（#71 で2系列同時表示から変更） |
| DAM/JOYSOUND 完全分離（#71） | 最高点・グラフ・集計・並び替え・自己ベストを機種別に。一覧/並び替えはデフォルト機種基準、詳細はトグル切替 |
| セットリスト（今日） | 「📋」ボタンから当日歌う曲を選択。先頭に「今日」タブを表示。翌日自動クリア（`SetlistModal.tsx`） |
| ランダム選曲 | 「🎲」ボタンから範囲（すべて/各タブ）を選び、ランダムに1曲選んで詳細へ遷移（`RandomPickModal.tsx`） |
| 読み入力欄＋かな正規化ローカル検索（#42, #61〜#63, #69） | 曲名/アーティストの「読み」を任意入力。持ち歌リストの検索はひらがな/カタカナ・全角半角・大小文字を区別しない（`src/lib/text.ts`）。読みがあれば五十音順の並び替えにも使用 |
| 並び替え（持ち歌リスト） | 登録日/最高スコア/記録回数/最終記録日/スコア伸び率 に加え、曲名順・アーティスト名順（読み優先の五十音）。昇順/降順トグル |
| 点数の小数第3位表示（#33） | スコアを全画面で小数第3位まで統一表示（§13 参照） |
| 記録日の変更（#18） | 点数記録時に ‹/› で日付を1日単位変更（未来日不可） |
| 復元のアンドゥ・全削除の3択（#19） | バックアップ復元・全データ削除の操作に確認/取り消しの導線 |
| キー上限・下限（±7） | KeyStepper のキー調整に上限下限（±7）を設定 |
| タブ名の重複チェック | タブの追加・リネーム時に同名を弾く |
| コーチマーク・初回ガイド | 初回起動時の操作ガイド（`CoachMark.tsx` / `FirstLaunchGuide.tsx`） |
| ヘルプ画面 | アプリ内ヘルプ（`app/help.tsx` ＋ `src/data/helpContent.ts`）。v1.0 から実機に存在 |

## 12. 今後の対応候補

- Google Play 一般公開（Phase 4 完了後）
- App Store 申請・公開（Phase 5）

---

## 13. 確定実装仕様（変更前に必ず確認）

以下はすでに動作しています。**理由なく変更しないこと。**

### 曲管理
- 曲の登録・編集・削除（左スワイプ）
- タブ（カテゴリ）の作成・編集・削除
- 曲↔タブの多対多紐づけ
- キー（音域）ステッパー

### スコア管理
- 点数の手入力（テンキー UI）
- 日付ナビゲーション（‹/›ボタンで1日単位変更、未来日付は不可）
- スコア履歴の編集・削除（左スワイプ）
- 点数推移グラフ（react-native-gifted-charts）

### 曲カードのスコア表示ルール（確定仕様）
```typescript
// best_score は「デフォルト機種」の最高点（DAM/JOYSOUND 完全分離 #71）。0点は「—」表示（0点→「—」ルールは変更禁止）
// ラベルはデフォルト機種に応じて DAM BEST / JOY BEST。スコアは小数第3位まで表示
const score = song.best_score; // useSongs(tabId, defaultMachine) で機種別集計済み
{score != null && score > 0 ? score.toFixed(3) : '—'}
```
> スコアの小数桁は全画面で統一して3桁表示（曲一覧カード・曲詳細の履歴/最高スコア/前回比/削除ダイアログ・グラフの点ラベル・記録シートの自己ベスト）。

### DAM/JOYSOUND スコア完全分離（#71・確定仕様）
- 最高点・グラフ・記録回数・最新・最終記録日・伸び率の集計は**機種別**（`scores.machine` で絞る）。DBスキーマ変更なし
- 曲一覧カード・並び替え：**デフォルト機種（`default_machine`）**の値を使用。変更すると追従。無記録は「—」。ラベルは `DAM BEST`/`JOY BEST`
- 曲詳細：DAM/JOYSOUND トグルで最高点カード（＋前回比・記録回数）とグラフを切替。**初期＝デフォルト機種**。グラフは選択機種1系列。**記録履歴リストは全機種**（機種バッジで区別）
- 自己ベスト更新バナー：**記録した機種**の最高点と比較して判定（`getBestScore(songId, machine)`）
- `getAllSongs/getSongsByTab/getSongsByIds` は任意引数 `machine` で機種別集計（未指定は合算）

### iTunes Search API（1.1.0 検索モーダル）
- 実装: `src/features/songSearch/itunes.ts` の `searchSongs(term, mode)`
- モード別 attribute: 曲から=`songTerm` / アーティスト=`artistTerm` / キーワード=指定なし
- `limit=200` / `country=JP` / `lang=ja_jp`。例外を投げず成功/失敗を型で返し、通信失敗(network/http/parse)と0件を区別
- ひらがな入力でも漢字名・英語名・愛称・略称がヒットすることを検証済み（検証日・条件は ⚠️ 未記録）。そのため、アプリ側で「ひらがな→カタカナ変換して2回検索」する処理は行わない
- デバウンス 300ms。古い結果が新しい結果を上書きしないよう seq で最新優先（`useSongSearch`）
- 【レガシー】1.0.x のインライン候補（`src/hooks/useMusicSearch.ts` / `src/api/itunesSearch.ts`・`pausedRef`/abort 制御）は 1.1.0 で未使用

### Android 対応（実装済み）
- ステータスバー制御
- `KeyboardAvoidingView`（`behavior="height"`）
- `Modal`（Android互換）
- スプラッシュ画面
- アダプティブアイコン（foreground / background / monochrome）

---

## 14. バグ修正状況

以下の修正は `fix/bug-fixes-after-review` ブランチで実装されたが、
drag-reorder機能のrevertと一緒に取り消されました。
その後、T4〜T5 タスクで改めて再適用されています。

| fix | 内容 | 対象ファイル | 状態 |
|---|---|---|---|
| fix-C | iTunes検索の最小文字数を 2→1 に変更（1文字のアーティスト名対応） | `src/hooks/useMusicSearch.ts` | ✅ T5で適用済み |
| fix-D | 編集モード起動時に `pausedRef` をリセット・`song.tabs` の nullチェック追加 | `app/song/new.tsx` | ✅ T4で適用済み |
| fix-E | `react-native-reanimated` を Expo SDK 54 互換バージョン（`~4.1.1`）に固定 | `package.json` | ✅ 対象外（解決済み）。Expo SDK 57 へ更新済みで、現在 `react-native-reanimated` は依存に含まれていない（`package.json` で確認）。固定作業は不要 |

---

## 15. app.json の Android 設定（確認済み）

```json
{
  "android": {
    "package": "com.rengemaru.utacho",
    "versionCode": 3,
    "permissions": ["android.permission.INTERNET"],
    "adaptiveIcon": {
      "foregroundImage": "./assets/android-icon-foreground.png",
      "backgroundImage": "./assets/android-icon-background.png",
      "monochromeImage": "./assets/android-icon-monochrome.png"
    },
    "predictiveBackGestureEnabled": false
  }
}
```

> targetSdk / compileSdk 36 は `plugins` の `expo-build-properties`（`targetSdkVersion: 36` / `compileSdkVersion: 36`）で固定している。
> アプリの表示バージョン（`expo.version`）は `1.1.0`。`android.versionCode` はアップロードのたびに増やす（現在 3）。

---

## 16. eas.json の設定（確認済み）

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services-key.json",
        "track": "internal"
      }
    }
  }
}
```

> ⚠️ `track: "internal"` は内部テスト配布の設定です。
> 一般公開時は `"track": "production"` に変更が必要です。

---

## 17. 将来フェーズ

### Phase 5: iOS / App Store 公開
- Apple Developer Program 登録（年額 $99）
- EAS Build（iOS）
- TestFlight での動作確認
- App Store Connect セットアップ・審査申請

### Phase 6: 機能追加（未確定）
- データエクスポート（CSV等）
- 曲の並び替え（drag-reorder）※過去に実装・バグのため取り消し済み

---

*このファイルはプロジェクトルートの `CLAUDE.md` として配置されている。*
