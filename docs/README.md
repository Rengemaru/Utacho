# docs 索引

歌帳プロジェクトのドキュメント置き場。用途ごとにフォルダを分けている。

## 構成（Git 管理）

| パス | 内容 |
|---|---|
| `releases/` | リリース手順書。[release-1.1.0.md](./releases/release-1.1.0.md) / [release-1.2.0.md](./releases/release-1.2.0.md) / [release-1.2.1.md](./releases/release-1.2.1.md) |
| `specs/` | 仕様書。索引は [specs/README.md](./specs/README.md)。1.0.1（fix-f）/ 1.0.2（API36）/ 1.1.0（曲検索フロー）を収録 |
| `wireframes/` | 画面ワイヤーフレーム。**正は [v6-current.html](./wireframes/v6-current.html)**。旧版は `wireframes/archive/`（v3 / v5） |

> UI 実装時の画面デザイン基準は `wireframes/v6-current.html`（CLAUDE.md 冒頭でも参照）。

## 構成（ローカル専用・`.gitignore` 済み）

リポジトリには含めない個人用の作業ファイル。手元でのみ参照する。

| パス | 内容 |
|---|---|
| `instructions/` | 過去の作業指示書・タスク定義（履歴として保持） |
| `reports/` | セッションレポート・改善提案メモ |
| `demo/` | デモ用のバックアップ JSON と生成スクリプト |
| `builds/` | 過去に提出した AAB の保管（審査が通らなかった際に提出状態を追えるように残す） |

## 命名ルール
- リリース手順書：`releases/release-<version>.md`
- 仕様書：`specs/spec-<version>-<topic>.md`
- ワイヤーフレーム：現行は `wireframes/v<n>-current.html`、旧版は `wireframes/archive/v<n>.html`
