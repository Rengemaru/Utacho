# 1.0.1 仕様書：fix-F 本格修正

> versionName：1.0.1 / ターゲットAPI：35（延長中。変更しない） / 前提：なし
> 索引：[README.md](./README.md)

> **状態（2026-10-07 追記）**：fix-F の内容は #33 の一連の実装（検索モーダル化・`SearchResultList` の切り出し）で解消済み。
> **1.0.1 としての単独配布は行っていない可能性が高い**（`app.json` の versionName に 1.0.1 の記録がない。⚠️ 確認中）。
> 本ファイルは計画時点の記録として残す。

## 1. 背景

曲登録画面（画面ID 04）で iTunes の候補リストが画面の途中で見切れ、スクロールもできない。候補が多い曲名では目的の曲にたどり着けず、曲の登録というコア機能を妨げている。クローズドテストのテスターからも改善要望が出ている。キーボード表示中の1回目のタップが効かない疑いもある。

## 2. スコープ

### やること
- 候補リストを、候補が多くても最後までスクロールして選択できるようにする
- キーボード表示中でも、1回目のタップで候補を選択できるようにする
- 候補リストを**独立した部品（`SearchResultList`）として切り出す**。1.1.0 の検索モーダルで流用するため

### やらないこと
- 検索ロジック（iTunes API のパラメータ、件数、デバウンス）の変更。1.1.0 で行う
- 画面構成・UIデザインの変更。見た目は現状維持
- targetSdkVersion の変更。1.0.2 で行う
- DB スキーマの変更

## 3. 原因の仮説（⚠️ いずれも未確認。A1 で確定させる）

1. 候補を `View` ＋ `.map()` で描画しており、スクロールできない
2. 候補リストの親が `position: 'absolute'` で、Android では親の範囲外がクリップされタッチもできない
3. `ScrollView` の中に `FlatList` を入れ子にしており、スクロールが競合している
4. `keyboardShouldPersistTaps` が未設定で、キーボード表示中の1回目のタップがキーボードを閉じる操作に使われている

## 4. タスク

### A1 原因調査（調査のみ・1.5h）
Claude Code で調査し、コードは変更しない。

調査項目：
- 候補リストを描画しているコンポーネントのファイルと行番号
- 描画方式（View＋map / FlatList / ScrollView）
- 親要素のレイアウト（position、高さ、overflow）
- スクロール要素の入れ子の有無
- `keyboardShouldPersistTaps`・`KeyboardAvoidingView` の設定
- `src/hooks/useMusicSearch.ts` のデバウンス有無、iTunes API に渡しているパラメータの実際の値、エラー時と0件時の区別（1.1.0 の設計に使う）
- 同じ候補リスト・検索フックを使う他の画面の有無
- 重複登録チェックの実装箇所と、OS標準の `Alert` を使っているか
- 【1.0.2 の事前調査】expo・react-native のバージョン、targetSdkVersion の指定箇所、eas.json の versionCode 自動採番設定、`BackHandler` の使用箇所

**受け入れ条件**：上記すべてについて「ファイルパス:行番号」と要点が報告され、原因候補が可能性の高い順に根拠つきで並んでいる。確信のない点は「未確認」と明記されている。

### A2 修正方針の決定（1h）
A1 の結果をオーナーとテックリードで確認し、方針を確定する。

`SearchResultList` の想定インターフェース（A1 の結果に応じて調整してよい）：

```ts
type SongCandidate = {
  trackId: number;
  title: string;       // iTunes の trackName
  artist: string;      // iTunes の artistName
  artworkUrl: string | null;
  releaseDate: string | null; // 1.1.0 の並び替えで使う。1.0.1 では未使用でよい
};

type SearchResultListProps = {
  items: SongCandidate[];
  onSelect: (item: SongCandidate) => void;
  ListHeaderComponent?: React.ReactElement | null; // 1.1.0 で件数表示に使う
  ListFooterComponent?: React.ReactElement | null; // 1.1.0 で「もっと見る」に使う
};
```

設計の要点：
- 中身は `FlatList`（画面に見えている分だけ描画する仕組み）
- `keyboardShouldPersistTaps="handled"` を設定する
- 親に `ScrollView` を置かない（入れ子にしない）
- 高さは親のレイアウトに従う（`flex: 1` 等）。固定高さや `position: 'absolute'` に依存しない

**受け入れ条件**：方針（どこを、なぜ、どう直すか）が文章で決まり、Notion のロードマップに記録されている。

### A3 リストの FlatList 化（2h）
- 候補リストを `SearchResultList` として別ファイルに切り出す
- スクロールの入れ子を解消する

**受け入れ条件**：候補が50件以上出る語で、最後の候補までスクロールして表示できる。

### A4 キーボード処理（1.5h）
- `keyboardShouldPersistTaps` の設定
- キーボード表示中にリスト下部が隠れないよう調整する

**受け入れ条件**：キーボードを表示したまま、1回目のタップで候補を選択できる。キーボード表示中もリストの最後の候補まで到達できる。

### A5 実機確認（1h）
**受け入れ条件**：Android 実機で次をすべて確認した。
- [ ] 「愛」「あ」など候補が多い語で、最後までスクロールできる
- [ ] キーボード表示中に1回目のタップで選択でき、曲名・アーティスト名・アートがフォームに入る
- [ ] 候補が少ない語・0件の語でも表示が崩れない
- [ ] 編集画面など、同じ部品を使う他の画面で不具合が出ていない
- [ ] 重複登録チェックが従来どおり動く

### C1〜C3 配布
[README.md の共通ルール](./README.md#配布各リリース共通の-c-タスク) に従う。versionName は **1.0.1**。

## 5. 補足

- 1.1.0 では曲登録画面のインライン候補リスト自体が廃止され、検索モーダルに置き換わる。`SearchResultList` を独立部品にしておくことで、今回の成果をそのまま流用し、手戻りを小さくする。
