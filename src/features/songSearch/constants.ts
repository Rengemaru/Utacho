// 曲検索モーダル（1.1.0）の定数。仕様書 §3・§5・§6.2 に対応。

/** 1回の検索で iTunes から取得する最大件数（取得上限） */
export const FETCH_LIMIT = 200;

/** 一度に画面へ出す件数（表示単位）。「もっと見る」でこの単位ずつ増やす */
export const PAGE_SIZE = 50;

/** 入力が止まってから検索するまでの待ち時間（ms）。1.0.1 の現行値を踏襲 */
export const DEBOUNCE_MS = 300;

/** iTunes Search API の固定パラメータ（1.0.1 の現行値を維持）。§5.3 */
export const ITUNES_COUNTRY = 'JP';
export const ITUNES_LANG = 'ja_jp';
